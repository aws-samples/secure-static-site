import { execSync } from "child_process";

interface BuildStaticSiteProps {
  /**
   * command to build static site
   */
  buildCommand: string;
  /**
   * Environment Variables to be set before the build command
   * For example, passing { VITE_USER_POOL: "abcdef12345" },
   * may result in the comamnd "VITE_USER_POOL=abcdef12345 npm run build"
   */
  envVars?: Record<`VITE_${string}`, string>;
  /**
   * current working directory where the buildCommand will be run
   */
  path: string;
}

/**
 * Builds static site if site has changed
 * and updates supplied env vars
 */
export function buildStaticSite(props: BuildStaticSiteProps): void {
  const { buildCommand, envVars, path } = props;
  let cmd;
  if (envVars) {
    const envVarsString = recordToEnvVars(envVars);
    cmd = `${envVarsString} ${buildCommand}`;
  } else {
    cmd = buildCommand;
  }
  execSync(cmd, { cwd: path, stdio: "inherit" });
}

export function recordToEnvVars(record: Record<string, string>): string {
  return Object.entries(record).reduce(
    (prev, [k, v]) => (prev ? `${prev} ${k}="${v}"` : `${k}="${v}"`),
    ""
  );
}
