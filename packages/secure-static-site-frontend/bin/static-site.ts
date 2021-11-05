#!/usr/bin/env node
import { App, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StaticSite } from "secure-static-site";

const app = new App();
const name = "secure-static-site";

class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // By default, StaticSite will run `npm run build` and look for 
    // compiled static assets in the dist folder
    const staticSite = new StaticSite(this, "SecureStaticSite", {
      envVars: { VITE_TEST_VAR: "PUBLIC_API_KEY_123" },
      responseHeaders: {
        contentSecurityPolicy: {
          fontSrc: "'self' data:",
          styleSrc: "'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
          // scriptSrc: "'self' https://unpkg.com/react@17/umd/react.production.min.js",
          // styleSrc: "'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css",
          // fontSrc: "'self' data: http://themes.googleusercontent.com/static/fonts/overlock/v2/Pr-80_x4SIOocpxz2VxC5fesZW2xOQ-xsNqO47m55DA.woff",
          // mediaSrc: "'self'",
        },
      },
      // enableWaf: true,
      // enableWafMetrics: true,
      // disableCoreWafRuleGroup: true,
      // disableAmazonIPWafRuleGroup: true,
      // disableAnonymousIPWafRuleGroup: true,
      // allowedIPs: ["11.22.33.44/32"],
      // domainNameBase: "basedomain.com",
      // domainNamePrefix: "secure-static-site",
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
