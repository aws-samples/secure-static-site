import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/lib/aws-s3";
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/lib/aws-cloudfront";
import { RemovalPolicy } from "aws-cdk-lib";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { resolve } from "path";
import { CfnWebACL, CfnIPSet } from "aws-cdk-lib/aws-wafv2";
import { buildStaticSite } from "./buildStaticSite";

export interface StaticSiteProps {
  /**
   * path where buildCommand will be run
   * @default "./"
   */
  path?: string;
  /**
   * @default "dist"
   */
  distFolder?: string;
  /**
   * command to build static site
   * @default "npm run build"
   */
  buildCommand?: string;
  /**
   * Environment variables set when buildCommand runs
   */
  envVars?: Record<`VITE_${string}`, string>;
  /**
   * IPs that are allowed to view docs - uses WAF
   */
  allowedIps?: string[];
}
/**
 * StaticSite Construct
 * Creates an S3 Bucket, Origin Access Identity, CloudFront Web Distribution,
 * and builds Static Site with optional environment variables
 */
export class StaticSite extends Construct {
  bucket: Bucket;
  cloudFrontWebDistribution: CloudFrontWebDistribution;

  constructor(scope: Construct, id: string, props: StaticSiteProps) {
    super(scope, id);
    const {
      path = "./",
      distFolder = "dist",
      envVars,
      buildCommand = "npm run build",
      allowedIps,
    } = props;
    this.bucket = new Bucket(this, "StaticSiteBucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
    });
    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "StaticSiteOAI"
    );
    this.bucket.grantRead(originAccessIdentity);
    let webACL: CfnWebACL | undefined = undefined;
    if (allowedIps) {
      const ipRuleSet = new CfnIPSet(this, "IPRuleSet", {
        addresses: allowedIps,
        ipAddressVersion: "IPV4",
        scope: "CLOUDFRONT",
      });
      webACL = new CfnWebACL(this, "WebACL", {
        defaultAction: { block: {} },
        rules: [
          {
            action: { allow: {} },
            name: "AllowIPs",
            statement: { ipSetReferenceStatement: { arn: ipRuleSet.attrArn } },
            priority: 1,
            visibilityConfig: {
              cloudWatchMetricsEnabled: false,
              metricName: "AllowIPsMetric",
              sampledRequestsEnabled: false,
            },
          },
        ],
        scope: "CLOUDFRONT",
        visibilityConfig: {
          cloudWatchMetricsEnabled: false,
          metricName: "BlockAllMetric",
          sampledRequestsEnabled: false,
        },
      });
    }
    this.cloudFrontWebDistribution = new CloudFrontWebDistribution(
      this,
      "StaticSiteWebDistribution",
      {
        webACLId: webACL ? webACL.attrArn : undefined,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.bucket,
              originAccessIdentity,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    );
    // TODO: create CloudFront Function to specify Content-Security-Policy
    buildStaticSite({ path, buildCommand, envVars });
    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: this.bucket,
      sources: [Source.asset(resolve(path, distFolder))],
      distribution: this.cloudFrontWebDistribution,
    });
  }
}
