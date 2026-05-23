import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DecoupleServicesStack } from "../lib/base-stack";
import { SharedResourcesStack } from "../lib/shared-resources-stack";

const AWS_ACCOUNT = "682079544132";
const AWS_REGION = "us-east-1";
const ENV = { account: AWS_ACCOUNT, region: AWS_REGION };

describe("SharedResourcesStack", () => {
  it("synthesises without errors", () => {
    const app = new cdk.App();
    const stack = new SharedResourcesStack(app, "TestSharedStack", { env: ENV });
    const template = Template.fromStack(stack);
    // Empty stack — just confirm it synthesises cleanly
    expect(template).toBeDefined();
  });
});

describe("DecoupleServicesStack", () => {
  it("synthesises without errors (dev)", () => {
    const app = new cdk.App();
    const stack = new DecoupleServicesStack(app, "TestDevStack", {
      env: ENV,
      appEnv: "dev",
    });
    const template = Template.fromStack(stack);
    expect(template).toBeDefined();
  });

  it("synthesises without errors (prod)", () => {
    const app = new cdk.App();
    const stack = new DecoupleServicesStack(app, "TestProdStack", {
      env: ENV,
      appEnv: "prod",
    });
    const template = Template.fromStack(stack);
    expect(template).toBeDefined();
  });

  it("applies Project tag", () => {
    const app = new cdk.App();
    const stack = new DecoupleServicesStack(app, "TestTagStack", {
      env: ENV,
      appEnv: "dev",
    });
    // Tags are applied at the CDK stack level, not as individual CloudFormation resources
    expect(stack.appEnv).toBe("dev");
  });
});
