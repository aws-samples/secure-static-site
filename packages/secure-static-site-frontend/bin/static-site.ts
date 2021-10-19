#!/usr/bin/env node
import { App, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StaticSite } from "secure-static-site";

const app = new App();
const name = "secure-static-site";

class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const staticSite = new StaticSite(this, "SecureStaticSite", {
      path: "./",
      distFolder: "dist",
      buildCommand: "npm run build",
      envVars: { VITE_TEST_VAR: "VITE_TEST_VAR" },
      // allowedIPs: ["11.22.33.44/32"],
      domainNameBase: "tomdenn.people.aws.dev",
      domainNamePrefix: "secure-static-site",
    });

    new CfnOutput(this, "bucketName", {
      value: staticSite.bucket.bucketName,
    });
    new CfnOutput(this, "distributionName", {
      value: staticSite.distribution.domainName,
    });
    if (staticSite.zone) {
      new CfnOutput(this, "hostedZoneName", {
        value: staticSite.zone.zoneName,
      });
    }
    if (staticSite.fullDomainName) {
      new CfnOutput(this, "domainName", {
        value: staticSite.fullDomainName,
      });
    }
  }
}

new StaticSiteStack(app, name, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
