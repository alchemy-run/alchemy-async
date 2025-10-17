import { execa } from "execa";
import { throwWithContext } from "../errors.ts";
import type { ProjectContext } from "../types.ts";

export const PackageManager = {
  bun: {
    init: "bun init -y",
    install: "bun install",
    add: "bun add",
    addDev: "bun add -D",
    run: "bun run",
    create: "bun create",
    x: "bunx",
  },
  npm: {
    init: "npm init -y",
    install: "npm install",
    add: "npm install",
    addDev: "npm install --save-dev",
    run: "npm run",
    create: "npm create",
    x: "npx",
  },
  pnpm: {
    init: "pnpm init",
    install: "pnpm install",
    add: "pnpm add",
    addDev: "pnpm add -D",
    run: "pnpm run",
    create: "pnpm create",
    x: "pnpm dlx",
  },
  yarn: {
    init: "yarn init -y",
    install: "yarn install",
    add: "yarn add",
    addDev: "yarn add -D",
    run: "yarn",
    create: "yarn create",
    x: "yarn dlx",
  },
  deno: {
    init: "deno init",
    install: "deno install",
    add: "deno add",
    addDev: "deno add",
    run: "deno task",
    create: "deno run -A",
    x: "deno run -A",
  },
} as const;

export async function installDependencies(
  context: ProjectContext,
  { dependencies, devDependencies, cwd }: {
    dependencies?: string[];
    devDependencies?: string[];
    cwd?: string;
  } = {},
) {
  const targetCwd = cwd || context.path;
  const pm = context.packageManager;
  const commands = PackageManager[pm];

  try {
    if (!dependencies && !devDependencies) {
      await execa(commands.install, {
        cwd: targetCwd,
        shell: true,
        stdio: "pipe",
      });
    }

    if (dependencies) {
      await execa(`${commands.add} ${dependencies.join(" ")}`, {
        cwd: targetCwd,
        shell: true,
        stdio: "pipe",
      });
    }

    if (devDependencies) {
      await execa(`${commands.addDev} ${devDependencies.join(" ")}`, {
        cwd: targetCwd,
        shell: true,
        stdio: "pipe",
      });
    }
  } catch (error) {
    throwWithContext(error, "Failed to install dependencies");
  }
}
