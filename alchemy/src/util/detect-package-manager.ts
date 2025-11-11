import { exists } from "./exists.ts";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm" | "deno";

export async function detectPackageManager(
  path: string = process.cwd(),
): Promise<PackageManager> {
  if (await exists(`${path}/deno.lock`)) return "deno";
  if (
    (await exists(`${path}/deno.json`)) ||
    (await exists(`${path}/deno.jsonc`))
  )
    return "deno";
  if (await exists(`${path}/bun.lockb`)) return "bun";
  if (await exists(`${path}/bun.lock`)) return "bun";
  if (await exists(`${path}/pnpm-lock.yaml`)) return "pnpm";
  if (await exists(`${path}/yarn.lock`)) return "yarn";

  if (process.env.npm_execpath?.includes("bun")) {
    return "bun";
  }

  if (process.env.DENO) {
    return "deno";
  }

  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    if (userAgent.startsWith("deno")) return "deno";
    if (userAgent.startsWith("bun")) return "bun";
    if (userAgent.startsWith("pnpm")) return "pnpm";
    if (userAgent.startsWith("yarn")) return "yarn";
    if (userAgent.startsWith("npm")) return "npm";
  }

  return "npm";
}

export async function getPackageManagerRunner(): Promise<string> {
  const packageManager = await detectPackageManager();
  return {
    bun: "bun run",
    pnpm: "pnpm",
    yarn: "yarn",
    npm: "npx",
    deno: "deno run",
  }[packageManager];
}
