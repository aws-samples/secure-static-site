import { readFileSync } from "fs";
import { resolve } from "path";

interface ContentSecurityPolicy {
  /**
   * default-src - override default behavior of script-src, connect-src, style-src, img-src, media-src, font-src, object-src, child-src
   * @default 'none'
   */
  defaultSrc?: string;
  /**
   * script-src - limits origins from where scripts can be loaded
   * @default 'self'
   */
  scriptSrc?: string;
  /**
   * connect-src - limits the origins that you can connect to (via XHR, WebSockets, and EventSource)
   * @default 'self'
   */
  connectSrc?: string;
  /**
   * style-src - defines the origins from which stylesheets can be loaded
   * @default 'self'
   */
  styleSrc?: string;
  /**
   * img-src - defines the origins from which images can be loaded
   * @default 'self'
   */
  imgSrc?: string;
  /**
   * font-src - specifies the origins that can serve web fonts
   * @default 'self'
   */
  fontSrc?: string;
  /**
   * media-src - restricts the origins allowed to deliver video and audio
   * @default undefined
   */
  mediaSrc?: string;
  /**
   * object-src - allows control over Flash and other plugins
   * @default undefined
   */
  objectSrc?: string;
  /**
   * child-src - lists the URLs for workers and embedded frame contents
   * @default undefined
   */
  childSrc?: string;
  /**
   * form-action - lists valid endpoints for submission from <form> tags
   * @default 'none'
   */
  formAction?: string;
  /**
   * frame-ancestors - specifies the sources that can embed the current page
   * @default 'none'
   */
  frameAncestors?: string;
}

interface StrictTransportSecurity {
  /**
   * maxAge - how long user agents will redirect to HTTPS, in seconds
   * @default 63072000
   */
  maxAge?: number;
  /**
   * includeSubdomains - whether user agents should upgrade requests on subdomains
   * @default true
   */
  includeSubdomains?: boolean;
  /**
   * preload - whether the site should be included in the HSTS preload list
   * @default true
   */
  preload?: boolean;
}

/**
 * Control the response headers added by CloudFront Functions with specific
 * parameters for security related headers.
 * Note, X-Frame-Options were considered to be added as a specific parameter
 * but CSP's frame-ancestors achieves the same functionality. X-XSS-Protection
 * is not needed because the CSP policy can prevent unsafe inline JS.
 */
export interface ResponseHeaders {
  /**
   * Custom HTTP headers set on response
   * @defualt undefined
   * @example { "Access-Control-Allow-Origin": "*" }
   */
  custom?: Record<string, string>;
  /**
   * Content Security Policies are allow lists to tell the client what it's allowed to download
   * Assign `false` to disable
   * Learn more [here]{@link https://developers.google.com/web/fundamentals/security/csp}
   * @default ```js
   * {
   *    defaultSrc: "none",
   *    scriptSrc: "self",
   *    connectSrc: "self",
   *    styleSrc: "self",
   *    imgSrc: "self"
   *    fontSrc: "self",
   *    formAction: "none",
   *    frameAncestors: "none",
   * }
   * ```
   */
  contentSecurityPolicy?: ContentSecurityPolicy | false;
  /**
   * HTTP Strict Transport Security notifies user agents to only connect to a given site over HTTPS
   * Assign `false` to disable
   * @default ```js
   * {
   *    maxAge: 63072000, // 2 years
   *    includeSubDomains: true,
   *    preload: true,
   * }
   * ```
   */
  strictTransportSecurity?: StrictTransportSecurity | false;
  /**
   * Indicates that the MIME types advertised in the Content-Type headers should be followed and not
   * changed.
   * Assign `false` to disable
   * Learn more [here]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options}
   * @deafult "sniff"
   */
  contentTypeOptions?: "nosniff" | false;
}

const cspDirectives: Record<keyof ContentSecurityPolicy, string> = {
  defaultSrc: "default-src",
  scriptSrc: "script-src",
  connectSrc: "connect-src",
  styleSrc: "style-src",
  formAction: "form-action",
  frameAncestors: "frame-ancestors",
  objectSrc: "object-src",
  mediaSrc: "media-src",
  childSrc: "child-src",
  fontSrc: "font-src",
  imgSrc: "img-src",
};

export function getFunctionCode(httpHeaders?: ResponseHeaders): string {
  const headers: Record<string, unknown> = httpHeaders?.custom || {};
  if (httpHeaders?.contentSecurityPolicy !== false) {
    headers["content-security-policy"] = {
      value: getCsp(httpHeaders?.contentSecurityPolicy),
    };
  }
  if (httpHeaders?.strictTransportSecurity !== false) {
    headers["strict-transport-security"] = {
      value: getSts(httpHeaders?.strictTransportSecurity),
    };
  }
  if (httpHeaders?.contentTypeOptions !== false) {
    headers["x-content-type-options"] = {
      value: httpHeaders?.contentTypeOptions || "nosniff",
    };
  }
  return readFileSync(resolve(__dirname, "./viewerResponseFn.js"))
    .toString()
    .replace("{{ADDITIONAL_HEADERS}}", JSON.stringify(headers));
}

export function getCsp(csp: ContentSecurityPolicy = {}): string {
  if (!csp.defaultSrc) csp.defaultSrc = "none";
  if (!csp.scriptSrc) csp.scriptSrc = "self";
  if (!csp.connectSrc) csp.connectSrc = "self";
  if (!csp.styleSrc) csp.styleSrc = "self";
  if (!csp.fontSrc) csp.fontSrc = "self";
  if (!csp.imgSrc) csp.imgSrc = "self";
  if (!csp.formAction) csp.formAction = "none";
  if (!csp.frameAncestors) csp.frameAncestors = "none";
  let cspString = "";
  for (const [k, v] of Object.entries(csp)) {
    let newV = v;
    if (v === "none" || v === "self") newV = `'${v}'`;
    cspString += `${cspDirectives[k as keyof ContentSecurityPolicy]} ${newV}; `;
  }
  return cspString.trim();
}

export function getSts(sts: StrictTransportSecurity = {}): string {
  if (!sts.maxAge) sts.maxAge = 63072000;
  if (!sts.includeSubdomains) sts.includeSubdomains = true;
  if (!sts.preload) sts.preload = true;
  let stsString = `max-age=${sts.maxAge}`;
  if (sts.includeSubdomains) stsString += "; includeSubDomains";
  if (sts.preload) stsString += "; preload";
  return stsString;
}
