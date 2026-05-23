import * as cdk from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
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
    // Stores sensitive runtime values (DATABASE_URL, CORS_ORIGINS, LOG_LEVEL).
    // No resource policy is attached, so any IAM principal in the account with
    // secretsmanager:GetSecretValue can read it.
    //
    // After first deploy, populate the real values:
    //   aws secretsmanager put-secret-value \
    //     --secret-id decouple-services/{env}/app \
    //     --secret-string '{"DATABASE_URL":"postgresql://...","CORS_ORIGINS":"*","LOG_LEVEL":"info"}'
    // ─────────────────────────────────────────────────────────────────────────
    const appSecret = new secretsmanager.Secret(this, "AppSecret", {
      secretName: `decouple-services/${this.appEnv}/app`,
      description: `Runtime configuration for decouple-services Lambda (${this.appEnv})`,
      // Placeholder JSON — replace values via AWS CLI or Console after deployment.
      secretObjectValue: {
        DATABASE_URL: cdk.SecretValue.unsafePlainText("PLACEHOLDER_REPLACE_ME"),
        CORS_ORIGINS: cdk.SecretValue.unsafePlainText("*"),
        LOG_LEVEL:    cdk.SecretValue.unsafePlainText(isProd ? "warn" : "debug"),
      },
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Grant the Lambda execution role read access to the secret.
    appSecret.grantRead(lambdaRole);

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
        // ARN passed to Lambda so it can fetch the full secret at cold start.
        APP_SECRET_ARN: appSecret.secretArn,
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
      description: "Secrets Manager secret ARN — update values here after first deploy",
      exportName: `${serviceName}-secret-arn`,
    });

    new cdk.CfnOutput(this, "AppSecretUpdateCommand", {
      value: [
        `aws secretsmanager put-secret-value`,
        `--secret-id decouple-services/${this.appEnv}/app`,
        `--secret-string '{"DATABASE_URL":"postgresql://user:pass@host:5432/db","CORS_ORIGINS":"*","LOG_LEVEL":"${isProd ? "warn" : "debug"}"}'`,
      ].join(" \\\n  "),
      description: "CLI command to populate the secret after deployment",
    });
  }
}
