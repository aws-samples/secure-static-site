import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/lib/aws-s3";
import {
  Distribution,
  Function,
  FunctionEventType,
  FunctionCode,
  ViewerProtocolPolicy,
  DistributionProps,
} from "aws-cdk-lib/lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { RemovalPolicy } from "aws-cdk-lib";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { resolve } from "path";
import { CfnWebACL, CfnIPSet } from "aws-cdk-lib/aws-wafv2";
import {
  IHostedZone,
  HostedZone,
  AaaaRecord,
  ARecord,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";

import { buildStaticSite } from "./buildStaticSite";
import { getFunctionCode, ResponseHeaders } from "./responseHeaders";

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
  /**
   * HTTP Response Headers
   * Headers added via CloudFront Function to origin responses
   * @default ```js
   * {
   *    contentSecurityPolicy: {
   *      defaultSrc: "none",
   *      scriptSrc: "self",
   *      connectSrc: "self",
   *      styleSrc: "self",
   *      formAction: "none",
   *      frameAncestors: "none",
   *    },
   *    strictTransportSecurity: {
   *      maxAge: 63072000, // 2 years
   *      includeSubDomains: true,
   *      preload: true,
   *    },
   * }
   * ```
   */
  responseHeaders?: ResponseHeaders;
  /**
   * Base domain name (should match Route 53 hosted zone name)
   */
  domainNameBase?: string;
  /**
   * Prefix for this application specifically (comes before hosted zone name in URL)
   * e.g. subsite.base.com
   */
  domainNamePrefix?: string;
}

/**
 * StaticSite Construct
 * Creates an S3 Bucket, Origin Access Identity, CloudFront Web Distribution,
 * and builds Static Site with optional environment variables
 */
export class StaticSite extends Construct {
  bucket: Bucket;
  distribution: Distribution;
  zone?: IHostedZone;
  fullDomainName?: string;

  constructor(scope: Construct, id: string, props: StaticSiteProps) {
    super(scope, id);
    const {
      path = "./",
      distFolder = "dist",
      envVars,
      buildCommand = "npm run build",
      allowedIps,
      responseHeaders,
      domainNameBase,
      domainNamePrefix,
    } = props;

    // S3
    this.bucket = new Bucket(this, "StaticSiteBucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
    });

    // WAF
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

    let distributionProps: DistributionProps = {
      defaultBehavior: {
        origin: new S3Origin(this.bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: new Function(this, "SecurityHeadersFn", {
              code: FunctionCode.fromInline(getFunctionCode(responseHeaders)),
              // explicit function name needed b/c https://github.com/aws/aws-cdk/issues/15523
              functionName: `SecureStaticSite${this.node.addr}`,
            }),
            eventType: FunctionEventType.VIEWER_RESPONSE,
          },
        ],
      },
      defaultRootObject: "index.html",
      webAclId: webACL?.attrId,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    };

    // configure Route 53 only if domain name base and prefix are set
    if (domainNameBase && domainNamePrefix) {
      this.zone = HostedZone.fromLookup(this, "StaticSiteHostedZone", {
        domainName: domainNameBase,
      });
      // prefix allows multiple apps to use same base
      this.fullDomainName = `${domainNamePrefix}.${domainNameBase}`;
      // can only create certificate in CDK if using Route 53 for DNS
      let certificate = new Certificate(this, "StaticSiteCertificate", {
        domainName: this.fullDomainName,
        validation: CertificateValidation.fromDns(this.zone),
        // allow subdomains (e.g. www, test, stage, etc)
        subjectAlternativeNames: [`*.${this.fullDomainName}`],
      });
      // update CloudFront distribution with domain names and certificate
      distributionProps = {
        ...distributionProps,
        domainNames: [this.fullDomainName, `www.${this.fullDomainName}`],
        certificate,
      };
    }

    // CloudFront
    this.distribution = new Distribution(
      this,
      "StaticSiteDistribution",
      distributionProps
    );

    // hosted zone and full domain name must exist to create Route 53 records
    if (this.zone && this.fullDomainName) {
      // IPv4
      new ARecord(this, "StaticSiteARecord", {
        zone: this.zone,
        recordName: this.fullDomainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      });
      new ARecord(this, "StaticSiteSubsiteARecord", {
        zone: this.zone,
        recordName: `*.${this.fullDomainName}`,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      });
      // IPv6
      new AaaaRecord(this, "StaticSiteAaaaRecord", {
        zone: this.zone,
        recordName: this.fullDomainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      });
      new AaaaRecord(this, "StaticSiteSubsiteAaaaRecord", {
        zone: this.zone,
        recordName: `*.${this.fullDomainName}`,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      });
    }

    // TODO: create CloudFront Function to specify Content-Security-Policy
    buildStaticSite({ path, buildCommand, envVars });
    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: this.bucket,
      sources: [Source.asset(resolve(path, distFolder))],
      distribution: this.distribution,
    });
  }
}