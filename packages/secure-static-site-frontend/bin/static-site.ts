#!/usr/bin/env node
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StaticSite } from "secure-static-site";

const app = new App();
const name = "secure-static-site";
class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new StaticSite(this, "SecureStaticSite", {
      path: "./",
      distFolder: "dist",
      buildCommand: "npm run build",
      envVars: { VITE_TEST_VAR: "VITE_TEST_VAR" },
      // allowedIps: [],
    });
  }
}

new StaticSiteStack(app, name);
