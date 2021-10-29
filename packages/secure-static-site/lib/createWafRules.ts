import { CfnWebACL, CfnIPSet } from "aws-cdk-lib/aws-wafv2";

interface Props {
  enableWafMetrics: boolean;
  disableAmazonIPWafRuleGroup?: boolean;
  disableAnonymousIPWafRuleGroup?: boolean;
  disableCoreWafRuleGroup?: boolean;
  allowedIPs?: string[];
  ipRuleSet?: CfnIPSet;
}

/**
 * Configure WAF rules for Web ACL based on provided props
 * @param props Configuration for WAF rules
 * @returns Array of WAF rules
 */
export const createWafRules = (props: Props): CfnWebACL.RuleProperty[] => {
  const {
    enableWafMetrics,
    disableAmazonIPWafRuleGroup,
    disableAnonymousIPWafRuleGroup,
    disableCoreWafRuleGroup,
    allowedIPs,
    ipRuleSet,
  } = props;
  let rules: CfnWebACL.RuleProperty[] = [];
  let priority = 0;

  if (!disableAmazonIPWafRuleGroup) {
    rules.push({
      overrideAction: { none: {} },
      name: "AmazonIP",
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesAmazonIpReputationList",
        },
      },
      priority: priority++,
      visibilityConfig: {
        cloudWatchMetricsEnabled: enableWafMetrics,
        metricName: "AmazonIPMetric",
        sampledRequestsEnabled: enableWafMetrics,
      },
    });
  }

  if (!disableAnonymousIPWafRuleGroup) {
    rules.push({
      overrideAction: { none: {} },
      name: "AnonymousIP",
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesAnonymousIpList",
        },
      },
      priority: priority++,
      visibilityConfig: {
        cloudWatchMetricsEnabled: enableWafMetrics,
        metricName: "AnonymousIPMetric",
        sampledRequestsEnabled: enableWafMetrics,
      },
    });
  }

  if (!disableCoreWafRuleGroup) {
    rules.push({
      overrideAction: { none: {} },
      name: "CoreRuleSet",
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
        },
      },
      priority: priority++,
      visibilityConfig: {
        cloudWatchMetricsEnabled: enableWafMetrics,
        metricName: "CoreRuleSetMetric",
        sampledRequestsEnabled: enableWafMetrics,
      },
    });
  }

  // add allowed IPs to rule list if applicable
  if (allowedIPs && ipRuleSet) {
    rules.push({
      action: { allow: {} },
      name: "AllowIPs",
      statement: { ipSetReferenceStatement: { arn: ipRuleSet.attrArn } },
      priority: priority++,
      visibilityConfig: {
        cloudWatchMetricsEnabled: enableWafMetrics,
        metricName: "AllowIPsMetric",
        sampledRequestsEnabled: enableWafMetrics,
      },
    });
  }

  return rules;
};
