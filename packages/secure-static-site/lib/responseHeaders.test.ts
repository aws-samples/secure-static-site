import { getCsp, getSts } from "./responseHeaders";

describe("getCsp", () => {
  test("default CSP", () => {
    const csp = getCsp({});
    expect(csp).toBe(
      "default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'self'; form-action 'none'; frame-ancestors 'none';"
    );
  });
});

describe("getSts", () => {
  test("default STS", () => {
    const sts = getSts();
    expect(sts).toBe("max-age=63072000; includeSubDomains; preload");
  });
});
