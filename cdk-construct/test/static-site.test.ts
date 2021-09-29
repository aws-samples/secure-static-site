import { Stack } from "aws-cdk-lib";
import "@aws-cdk/assert/jest";
import { StaticSite } from "../lib/static-site";

// need to mock these because they read from file system
jest.mock("../lib/buildStaticSite");
jest.mock("aws-cdk-lib/aws-s3-deployment");

describe("StaticSite Construct", () => {
  describe("AWS::S3::Bucket", () => {
    // TODO
  });
  describe("AWS::CloudFront::Distribution", () => {
    test("default cache behavior's viewer protocol policy is redirect-to-https", () => {
      const stack = new Stack();
      new StaticSite(stack, "StaticSite", { path: "" });
      expect(stack).toHaveResourceLike("AWS::CloudFront::Distribution", {
        DistributionConfig: {
          DefaultCacheBehavior: { ViewerProtocolPolicy: "redirect-to-https" },
        },
      });
    });
  });
});
