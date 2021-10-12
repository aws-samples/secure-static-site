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
   * @default 'none'
   */
  imgSrc?: string;
  /**
   * media-src - restricts the origins allowed to deliver video and audio
   * @default undefined
   */
  mediaSrc?: string;
  /**
   * font-src - specifies the origins that can serve web fonts
   * @default undefined
   */
  fontSrc?: string;
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
  maxAge: number;
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

export interface ResponseHeaders {
  /**
   * Other
   * Manual HTTP headers set on response
   * @defualt undefined
   * @example { "Access-Control-Allow-Origin": "*" }
   */
  other?: Record<string, string>;
  /**
   * Content Security Policies are allow lists to tell the client what it's allowed to download
   * Learn more [here]{@link https://developers.google.com/web/fundamentals/security/csp}
   * @default ```js
   * {
   *    defaultSrc: "none",
   *    scriptSrc: "self",
   *    connectSrc: "self",
   *    styleSrc: "self",
   *    formAction: "none",
   *    frameAncestors: "none",
   * }
   * ```
   */
  contentSecurityPolicy?: ContentSecurityPolicy;
  /**
   * HTTP Strict Transport Security notifies user agents to only connect to a given site over HTTPS
   * @default ```js
   * {
   *    maxAge: 63072000, // 2 years
   *    includeSubDomains: true,
   *    preload: true,
   * }
   * ```
   */
  strictTransportSecurity?: StrictTransportSecurity;
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
  const csp = getCsp(httpHeaders?.contentSecurityPolicy);
  const sts = getSts(httpHeaders?.strictTransportSecurity);
  const additionalHeaders = {
    "content-security-policy": { value: csp },
    "strict-transport-security": { value: sts },
    "x-content-type-options": { value: "nosniff" },
    "x-frame-options": { value: "DENY" },
    "x-xss-protection": { value: "1; mode=block" },
  };
  return readFileSync(resolve(__dirname, "./viewerResponseFn.js"))
    .toString()
    .replace("{{ADDITIONAL_HEADERS}}", JSON.stringify(additionalHeaders));
}

function getCsp(csp: ContentSecurityPolicy = {}): string {
  if (!csp.defaultSrc) csp.defaultSrc = "none";
  if (!csp.scriptSrc) csp.scriptSrc = "self";
  if (!csp.connectSrc) csp.connectSrc = "self";
  if (!csp.styleSrc) csp.styleSrc = "self";
  if (!csp.formAction) csp.formAction = "none";
  if (!csp.frameAncestors) csp.frameAncestors = "none";
  let cspString = "";
  for (const [k, v] of Object.entries(csp)) {
    let newV = v;
    if (v === "none" || v === "self") newV = `'${v}'`;
    cspString += `${cspDirectives[k as keyof ContentSecurityPolicy]} ${newV}; `;
  }
  return cspString;
}

function getSts(sts?: StrictTransportSecurity): string {
  let stsString = `max-age=${sts?.maxAge || 63072000}`;
  if (sts?.includeSubdomains) stsString += "; includeSubDomains";
  if (sts?.preload) stsString += "; preload";
  return stsString;
}
