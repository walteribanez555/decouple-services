import * as cdk from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import * as path from "path";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DecoupleServicesStackProps extends cdk.StackProps {
  /**
   * Application environment: "dev" | "prod".
   * Named `appEnv` (not `environment`) to avoid shadowing the built-in
   * `cdk.Stack.environment` property (which holds aws://account/region).
   */
  appEnv: string;

  /**
   * Logical service name used for all resource names.
   * Defaults to `decouple-services-{appEnv}`.
   */
  serviceName?: string;

  /**
   * CloudWatch log-retention in days for the API Gateway access log group.
   * Must be one of the valid values accepted by `logs.RetentionDays`.
   * Defaults to ONE_WEEK (7 days).
   */
  apiGwLogRetentionDays?: logs.RetentionDays;

  /**
   * Extra (non-sensitive) environment variables injected into the Lambda.
   * Sensitive values (DATABASE_URL, etc.) are stored in AWS Secrets Manager
   * and fetched by the Lambda at cold start via APP_SECRET_ARN.
   */
  lambdaEnvironmentVariables?: Record<string, string>;
}

// ─── Stack ────────────────────────────────────────────────────────────────────

export class DecoupleServicesStack extends cdk.Stack {
  /** Application environment ("dev" | "prod"). */
  public readonly appEnv: string;
  /** The HTTP API (ApiGatewayV2). */
  public readonly httpApi: apigatewayv2.CfnApi;
  /** The Lambda function that handles all routes. */
  public readonly lambdaFn: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: DecoupleServicesStackProps) {
    super(scope, id, props);

    this.appEnv = props.appEnv;

    const projectName = "decouple-services";
    const serviceName = props.serviceName ?? `${projectName}-${this.appEnv}`;
    const apiGwLogRetention = props.apiGwLogRetentionDays ?? logs.RetentionDays.ONE_WEEK;
    const isProd = this.appEnv === "prod";

    // ─── Stack-level tags ────────────────────────────────────────────────────
    cdk.Tags.of(this).add("Project", projectName);
    cdk.Tags.of(this).add("Environment", this.appEnv);
    cdk.Tags.of(this).add("ManagedBy", "CDK");

    // ─────────────────────────────────────────────────────────────────────────
    // IAM  –  Lambda execution role
    // Terraform: aws_iam_role.lambda_exec + aws_iam_role_policy_attachment
    // ─────────────────────────────────────────────────────────────────────────
    const lambdaRole = new iam.Role(this, "LambdaExecRole", {
      roleName: `${serviceName}-lambda-exec-role`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CloudWatch log group  –  Lambda logs
    // Terraform: aws_cloudwatch_log_group.lambda_log (retention_in_days = 7)
    // ─────────────────────────────────────────────────────────────────────────
    const lambdaLogGroup = new logs.LogGroup(this, "LambdaLogGroup", {
      logGroupName: `/aws/lambda/${serviceName}-function`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // AWS Secrets Manager — app configuration secret
    //
    // The secret is created and populated by the CI/CD pipeline BEFORE this
    // stack is deployed, so the real values are always available when
    // CloudFormation resolves the dynamic references below.
    //
    // Secret name convention: decouple-services/{env}/app
    // Keys: DATABASE_URL, CORS_ORIGINS, LOG_LEVEL
    //
    // CDK does NOT own the lifecycle of this secret — managing it externally
    // prevents a chicken-and-egg problem where placeholders would be resolved
    // into the Lambda configuration on first deploy.
    // ─────────────────────────────────────────────────────────────────────────
    const appSecret = secretsmanager.Secret.fromSecretNameV2(
      this, "AppSecret", `decouple-services/${this.appEnv}/app`
    );

    // Grant the Lambda execution role runtime read access (useful for future
    // rotation logic or manual secret refresh without a redeployment).
    appSecret.grantRead(lambdaRole);

    // ─────────────────────────────────────────────────────────────────────────
    // S3 bucket  —  temporary ID document storage for age verification
    //
    // Images are uploaded before the Bedrock call and deleted in a `finally`
    // block.  The 2-day lifecycle rule acts as a safety net in case a Lambda
    // timeout prevents the explicit deletion from running.
    // ─────────────────────────────────────────────────────────────────────────
    const verificationBucket = new s3.Bucket(this, "VerificationBucket", {
      bucketName: `${serviceName}-verification`,
      lifecycleRules: [
        {
          id: "expire-sessions",
          prefix: "sessions/",
          expiration: cdk.Duration.days(2),
          enabled: true,
        },
      ],
      // Never retain raw ID images beyond the stack lifetime.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // Block all public access — images are only accessed by the Lambda role.
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    verificationBucket.grantReadWrite(lambdaRole);

    // ─────────────────────────────────────────────────────────────────────────
    // Bedrock  —  allow Lambda to invoke Claude Sonnet for document analysis
    // ─────────────────────────────────────────────────────────────────────────
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "AllowBedrockInvokeModel",
        actions: ["bedrock:InvokeModel"],
        // Cross-region inference profiles require two resource patterns:
        //   1. The inference profile ARN (account-scoped, any region for routing)
        //   2. The underlying foundation model ARN (no account, wildcard region)
        resources: [
          `arn:aws:bedrock:*:${this.account}:inference-profile/us.anthropic.claude-sonnet-4*`,
          `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4*`,
        ],
      }),
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "AllowBedrockMarketplaceSubscription",
        actions: [
          "aws-marketplace:ViewSubscriptions",
          "aws-marketplace:Subscribe",
          "aws-marketplace:Unsubscribe",
        ],
        resources: ["*"],
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Lambda function
    // Terraform: aws_lambda_function.app
    //   runtime  = nodejs22.x
    //   handler  = index.handler  (src/index.ts exports `handler`)
    //   source   = apps/identification/src/index.ts  (bundled via esbuild)
    //   timeout  = 10 s  |  memory = 512 MB
    // ─────────────────────────────────────────────────────────────────────────
    this.lambdaFn = new lambdaNodejs.NodejsFunction(this, "AppFunction", {
      functionName: `${serviceName}-function`,
      description: "Offer, demand service",
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../../apps/identification/src/index.ts"),
      handler: "handler",
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
      environment: {
        // Non-sensitive config injected directly.
        NODE_ENV: isProd ? "production" : "development",
        // Sensitive values — CloudFormation resolves these from Secrets Manager
        // at deploy time using dynamic references. They become normal env vars
        // inside the Lambda container (process.env.DATABASE_URL etc.).
        // The CI/CD pipeline populates the secret BEFORE this stack is deployed
        // so CloudFormation always resolves real values, never placeholders.
        DATABASE_URL: appSecret.secretValueFromJson("DATABASE_URL").unsafeUnwrap(),
        CORS_ORIGINS: appSecret.secretValueFromJson("CORS_ORIGINS").unsafeUnwrap(),
        LOG_LEVEL:    appSecret.secretValueFromJson("LOG_LEVEL").unsafeUnwrap(),
        // ── Age-verification ────────────────────────────────────────────────
        S3_VERIFICATION_BUCKET: verificationBucket.bucketName,
        BEDROCK_MODEL_ID: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
        CONFIDENCE_THRESHOLD: "0.85",
        // Caller can pass extra non-sensitive vars (e.g. feature flags).
        ...props.lambdaEnvironmentVariables,
      },
      logGroup: lambdaLogGroup,
      // Mirrors apps/identification/esbuild.config.js
      bundling: {
        minify: isProd,
        sourceMap: !isProd,
        target: "node22",
        externalModules: ["aws-sdk", "@aws-sdk/*"],
        define: {
          "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
        },
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP API  (ApiGatewayV2)
    // Terraform: aws_apigatewayv2_api.api
    // ─────────────────────────────────────────────────────────────────────────
    this.httpApi = new apigatewayv2.CfnApi(this, "HttpApi", {
      name: serviceName,
      protocolType: "HTTP",
      description: "Serverless API",
      corsConfiguration: {
        allowCredentials: false,
        allowHeaders: ["*"],
        allowMethods: ["GET", "HEAD", "OPTIONS", "POST", "PATCH", "PUT", "DELETE"],
        allowOrigins: ["*"],
        exposeHeaders: ["*"],
        maxAge: 300,
      },
      tags: {
        Project: projectName,
        Environment: this.appEnv,
        ManagedBy: "CDK",
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CloudWatch log group  –  API Gateway access logs
    // Terraform: aws_cloudwatch_log_group.api_gw
    // ─────────────────────────────────────────────────────────────────────────
    const apiGwLogGroup = new logs.LogGroup(this, "ApiGwLogGroup", {
      logGroupName: `/aws/api_gw/${serviceName}-api`,
      retention: apiGwLogRetention,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // API Gateway stage  –  $default (auto-deploy)
    // Terraform: aws_apigatewayv2_stage.base
    // ─────────────────────────────────────────────────────────────────────────
    new apigatewayv2.CfnStage(this, "DefaultStage", {
      apiId: this.httpApi.ref,
      stageName: "$default",
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: apiGwLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          sourceIp: "$context.identity.sourceIp",
          requestTime: "$context.requestTime",
          protocol: "$context.protocol",
          httpMethod: "$context.httpMethod",
          resourcePath: "$context.resourcePath",
          routeKey: "$context.routeKey",
          status: "$context.status",
          responseLength: "$context.responseLength",
          integrationErrorMessage: "$context.integrationErrorMessage",
        }),
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Lambda integration  (AWS_PROXY, payload format 2.0)
    // Terraform: aws_apigatewayv2_integration.app
    //   integration_uri = aws_lambda_function.app.invoke_arn
    //   invoke_arn = arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{arn}/invocations
    // ─────────────────────────────────────────────────────────────────────────
    const lambdaInvokeArn = `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${this.lambdaFn.functionArn}/invocations`;

    const integration = new apigatewayv2.CfnIntegration(this, "LambdaIntegration", {
      apiId: this.httpApi.ref,
      integrationType: "AWS_PROXY",
      integrationUri: lambdaInvokeArn,
      integrationMethod: "POST",
      payloadFormatVersion: "2.0",
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Routes  –  ANY / and ANY /{proxy+}
    // Terraform: aws_apigatewayv2_route.proxy_root + proxy_all
    // ─────────────────────────────────────────────────────────────────────────
    new apigatewayv2.CfnRoute(this, "RootRoute", {
      apiId: this.httpApi.ref,
      routeKey: "ANY /",
      target: `integrations/${integration.ref}`,
    });

    new apigatewayv2.CfnRoute(this, "ProxyRoute", {
      apiId: this.httpApi.ref,
      routeKey: "ANY /{proxy+}",
      target: `integrations/${integration.ref}`,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Lambda resource policy  –  allow API GW to invoke
    // Terraform: aws_lambda_permission.allow_apigw_invoke
    //   source_arn = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
    //   execution_arn = arn:aws:execute-api:{region}:{account}:{api-id}
    // ─────────────────────────────────────────────────────────────────────────
    const executionArn = `arn:aws:execute-api:${this.region}:${this.account}:${this.httpApi.ref}`;

    new lambda.CfnPermission(this, "ApiGwInvokeLambda", {
      action: "lambda:InvokeFunction",
      functionName: this.lambdaFn.functionArn,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${executionArn}/*/*`,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Stack outputs
    // ─────────────────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: `https://${this.httpApi.ref}.execute-api.${this.region}.amazonaws.com`,
      description: "HTTP API endpoint URL",
      exportName: `${serviceName}-api-endpoint`,
    });

    new cdk.CfnOutput(this, "LambdaFunctionName", {
      value: this.lambdaFn.functionName,
      description: "Lambda function name",
      exportName: `${serviceName}-lambda-name`,
    });

    new cdk.CfnOutput(this, "LambdaFunctionArn", {
      value: this.lambdaFn.functionArn,
      description: "Lambda function ARN",
      exportName: `${serviceName}-lambda-arn`,
    });

    new cdk.CfnOutput(this, "AppSecretArn", {
      value: appSecret.secretArn,
      description: "Secrets Manager secret ARN (externally managed — populated by CI/CD before deploy)",
      exportName: `${serviceName}-secret-arn`,
    });

    new cdk.CfnOutput(this, "AppSecretBootstrapCommand", {
      value: [
        `aws secretsmanager create-secret`,
        `--name decouple-services/${this.appEnv}/app`,
        `--secret-string '{"DATABASE_URL":"postgresql://user:pass@host:5432/db","CORS_ORIGINS":"*","LOG_LEVEL":"${isProd ? "warn" : "debug"}"}'`,
      ].join(" \\\n  "),
      description: "One-time CLI command to create the secret before first CDK deploy",
    });
  }
}
