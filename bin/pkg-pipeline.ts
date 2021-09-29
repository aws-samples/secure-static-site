#!/usr/bin/env node
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PkgPipeline } from "@gb/cdk-pkg-pipeline";

const app = new App();
const name = "gb-cdk-static-site";
class PipelineStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new PkgPipeline(this, "PkgPipeline", {
      name: id,
      repoDescription: "Green Boost Static Site",
    });
  }
}

new PipelineStack(app, name);
