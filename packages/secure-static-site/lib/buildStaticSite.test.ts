import { recordToEnvVars } from "./buildStaticSite";

describe("buildStaticSite", () => {
  test("recordToEnvVars returns correct string", () => {
    const res = recordToEnvVars({ VITE_APP_USER_POOL: "abcdef12345" });
    expect(res).toEqual('VITE_APP_USER_POOL="abcdef12345"');
  });
});
