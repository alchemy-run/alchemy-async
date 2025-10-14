import { log } from "@clack/prompts";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import pc from "picocolors";
import z from "zod";
import { detectRuntime } from "../../src/util/detect-node-runtime.ts";
import { detectPackageManager } from "../../src/util/detect-package-manager.ts";
import { exists } from "../../src/util/exists.ts";
import { promiseWithResolvers } from "../../src/util/promise-with-resolvers.ts";
import { collectData } from "../../src/util/telemetry.ts";
import { ExitSignal } from "../trpc.ts";
import { CDPProxy } from "./cdp-manager/cdp-proxy.ts";
import { CDPManager } from "./cdp-manager/server.ts";
import { findWorkspaceRoot } from "./find-workspace-root.ts";

export const entrypoint = z
  .string()
  .optional()
  .describe("Path to the entrypoint file");

export const watch = z
  .boolean()
  .optional()
  .default(false)
  .describe("Watch for changes to infrastructure and redeploy automatically");

export const force = z
  .boolean()
  .optional()
  .default(false)
  .describe("Apply updates to resources even if there are no changes");

export const adopt = z
  .boolean()
  .optional()
  .default(false)
  .describe(
    "Adopt resources if they already exist but are not yet managed by your Alchemy app",
  );

export const execArgs = {
  cwd: z
    .string()
    .optional()
    .describe("Path to the project directory (defaults to current directory)"),
  quiet: z
    .boolean()
    .optional()
    .default(false)
    .describe("Suppress Create/Update/Delete messages"),
  stage: z
    .string()
    .optional()
    .describe(
      "Specify which stage/environment to target. Defaults to your username ($USER, or $USERNAME on windows)",
    ),
  inspect: z.boolean().optional().describe("Enable inspector"),
  inspectBrk: z
    .boolean()
    .optional()
    .describe("Enable inspector and break on start"),
  inspectWait: z
    .boolean()
    .optional()
    .describe("Enable inspector and wait for connection"),
  envFile: z.string().optional().describe("Path to environment file to load"),
  app: z
    .string()
    .optional()
    .describe("Select a specific application to target"),
  rootDir: z
    .string()
    .optional()
    .describe("Path to the root directory of the project"),
  profile: z
    .string()
    .optional()
    .describe("Alchemy profile to use for authorizing requests"),
} as const;

export async function execAlchemy(
  main: string | undefined,
  {
    cwd = process.cwd(),
    quiet,
    force,
    stage,
    destroy,
    watch,
    envFile,
    read,
    dev,
    inspect,
    inspectBrk,
    inspectWait,
    adopt,
    app,
    rootDir,
    profile,
  }: {
    cwd?: string;
    quiet?: boolean;
    force?: boolean;
    stage?: string;
    destroy?: boolean;
    watch?: boolean;
    envFile?: string;
    read?: boolean;
    dev?: boolean;
    adopt?: boolean;
    inspect?: boolean;
    inspectBrk?: boolean;
    inspectWait?: boolean;
    app?: string;
    rootDir?: string;
    profile?: string;
  },
) {
  const args: string[] = [];
  const execArgs: string[] = [];

  const shouldInspect = (inspect || inspectBrk || inspectWait) ?? false;

  const telemetryData = await collectData();

  args.push(`--telemetry-session-id ${telemetryData.sessionId}`);
  args.push(
    `--telemetry-ref ${telemetryData.referrer ? `${telemetryData.referrer}+cli` : "cli"}`,
  );

  if (quiet) args.push("--quiet");
  if (read) args.push("--read");
  if (force) args.push("--force");
  if (stage) args.push(`--stage ${stage}`);
  if (destroy) args.push("--destroy");
  if (watch) {
    execArgs.push("--watch");
    args.push("--watch");
  }
  if (envFile && (await exists(envFile))) {
    execArgs.push(`--env-file ${envFile}`);
  }
  if (dev) args.push("--dev");
  if (inspect) execArgs.push("--inspect");
  if (inspectWait) execArgs.push("--inspect-wait");
  if (inspectBrk) execArgs.push("--inspect-brk");
  if (adopt) args.push("--adopt");
  if (profile) args.push(`--profile ${profile}`);
  if (app) args.push(`--app ${app}`);
  if (rootDir) {
    args.push(`--root-dir ${rootDir}`);
  } else if (app) {
    console.log("finding root dir");
    try {
      const rootDir = await findWorkspaceRoot(cwd);
      // no root directory was provided but a specific app was provided, so we need to find the monorepo root
      args.push(`--root-dir ${rootDir}`);
      if (!envFile) {
        // move the default --env-file to the root of the monorepo
        const rootEnv = resolve(rootDir, ".env");
        if (await exists(rootEnv)) {
          execArgs.push(`--env-file ${rootEnv}`);
        }
      }
    } catch (error) {
      console.error("error finding monorepo root", error);
      throw error;
    }
  }

  // Check for alchemy.run.ts or alchemy.run.js (if not provided)
  if (!main) {
    const candidates = [
      "alchemy.run.ts",
      "alchemy.run.js",
      "alchemy.run.mts",
      "alchemy.run.mjs",
    ];
    for (const file of candidates) {
      const resolved = resolve(cwd, file);
      if (await exists(resolved)) {
        main = resolved;
        break;
      }
    }
  }

  if (!main) {
    log.error(
      pc.red(
        "No alchemy.run.ts or alchemy.run.js file found in the current directory.",
      ),
    );
    log.info("Create an alchemy.run.ts file to define your infrastructure.");
    throw new ExitSignal(1);
  }

  // Detect package manager
  const packageManager = await detectPackageManager(cwd);
  const runtime = detectRuntime();

  const argsString = args.join(" ");
  const execArgsString = execArgs.join(" ");
  // Determine the command to run based on package manager and file extension
  let command: string;
  const isTypeScript = main.endsWith("ts");

  switch (packageManager) {
    case "bun":
      command = `bun ${execArgsString} ${main} ${argsString}`;
      break;
    case "deno":
      command = `deno run -A ${execArgsString} ${main} ${argsString}`;
      break;
    case "pnpm":
      command = isTypeScript
        ? `pnpm dlx tsx ${execArgsString} ${main} ${argsString}`
        : `pnpm node ${execArgsString} ${main} ${argsString}`;
      break;
    case "yarn":
      command = isTypeScript
        ? `yarn tsx ${execArgsString} ${main} ${argsString}`
        : `yarn node ${execArgsString} ${main} ${argsString}`;
      break;
    default:
      switch (runtime) {
        case "bun":
          command = `bun ${execArgsString} ${main} ${argsString}`;
          break;
        case "deno":
          command = `deno run -A ${execArgsString} ${main} ${argsString}`;
          break;
        case "node":
          command = isTypeScript
            ? `npx tsx ${execArgsString} ${main} ${argsString}`
            : `node ${execArgsString} ${main} ${argsString}`;
          break;
      }
  }

  const childRuntime = command.split(" ")[0];

  const { promise: inspectorUrlPromise, resolve: resolveInspectorUrl } =
    promiseWithResolvers<string>();

  process.on("SIGINT", async () => {
    // hold the parent process open until the child process exits,
    // then the trpc middleware will handle the SIGINT after sending the event
    await exitPromise;
  });

  const child = spawn(command, {
    cwd,
    shell: true,
    stdio: ["inherit", "inherit", "pipe"],
    env: {
      ...process.env,
      FORCE_COLOR: "1",
    },
  });

  if (child.stderr) {
    child.stderr.on("data", (data) => {
      const string = data.toString();
      //* bun inspector url seems to always be on 6499
      //todo(michael): support node and deno
      const bunInspectorMatch = string.match(
        /ws:\/\/localhost:6499\/[a-zA-z0-9]*/,
      );
      const nodeInspectorMatch = string.match(
        /ws:\/\/127.0.0.1:9229\/[a-zA-z0-9-]*/,
      );
      if (bunInspectorMatch) {
        const inspectorUrl = bunInspectorMatch[0];
        resolveInspectorUrl(inspectorUrl);
      } else if (nodeInspectorMatch) {
        const inspectorUrl = nodeInspectorMatch[0];
        resolveInspectorUrl(inspectorUrl);
      }
      process.stderr.write(data);
    });
  }

  if (shouldInspect) {
    const inspectorUrl = await inspectorUrlPromise;
    //* we await to make sure bun has finished printing so we don't cut if off
    if (childRuntime === "bun") {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const cdpManager = new CDPManager();
    await cdpManager.startServer();
    const rootCDPProxy = new CDPProxy(inspectorUrl, {
      name: "alchemy.run.ts",
      server: cdpManager.server,
      connect: inspectWait || inspectBrk,
      domains:
        childRuntime === "bun"
          ? new Set(["Inspector", "Console", "Runtime", "Debugger", "Heap"])
          : new Set(["Runtime", "Debugger", "Profiler", "Log"]),
    });
    await cdpManager.registerCDPServer(rootCDPProxy);
    if (inspectWait || inspectBrk) {
      console.log("Waiting for inspector to connect....");
    }
  }

  const exitPromise = once(child, "exit");
  await exitPromise.catch(() => {});

  throw new ExitSignal(sanitizeExitCode(child.exitCode));
}

/**
 * If exit code is 130 (SIGINT) or null, return 0.
 * Otherwise, return the exit code.
 */
const sanitizeExitCode = (exitCode: number | null) => {
  if (exitCode === null || exitCode === 130) return 0;
  return exitCode;
};
