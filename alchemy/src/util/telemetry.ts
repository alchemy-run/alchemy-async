import envPaths from "env-paths";
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "pathe";
import pkg from "../../package.json" with { type: "json" };
import type { Phase } from "../alchemy.ts";
import { Scope } from "../scope.ts";
import { logger } from "./logger.ts";
import { memoize } from "./memoize.ts";

const ALCHEMY_DIR = path.join(os.homedir(), ".alchemy");
const ID_PATH = path.join(ALCHEMY_DIR, "id");
const ID_PATH_LEGACY = path.join(
  envPaths("alchemy", { suffix: "" }).config,
  "id",
);
const DISABLED_PATH = path.join(ALCHEMY_DIR, "telemetry-disabled");

export const TELEMETRY_DISABLED =
  !!process.env.ALCHEMY_TELEMETRY_DISABLED || !!process.env.DO_NOT_TRACK;

export const TELEMETRY_API_URL =
  process.env.ALCHEMY_TELEMETRY_API_URL ?? "https://telemetry.alchemy.run";
export const SUPPRESS_TELEMETRY_ERRORS =
  !!process.env.ALCHEMY_TELEMETRY_SUPPRESS_ERRORS;

export const getGlobalTelemetryDisabled = memoize(async () => {
  const disabled = await fs
    .readFile(DISABLED_PATH, "utf-8")
    .then((data) => data.trim() === "true")
    .catch(() => false);
  return disabled;
});

export async function setGlobalTelemetryDisabled() {
  await fs.mkdir(ALCHEMY_DIR, { recursive: true });
  await fs.writeFile(DISABLED_PATH, "true");
}

export async function setGlobalTelemetryEnabled() {
  await fs.rm(DISABLED_PATH, { force: true });
}

async function getOrCreateUserId() {
  async function readUserId(path: string) {
    try {
      return (await fs.readFile(path, "utf-8")).trim();
    } catch {
      return null;
    }
  }

  const id = await readUserId(ID_PATH);
  if (id) {
    return id;
  }

  const legacyId = await readUserId(ID_PATH_LEGACY);

  try {
    const id = legacyId ?? crypto.randomUUID();
    await fs.mkdir(ALCHEMY_DIR, { recursive: true });
    await fs.writeFile(ID_PATH, id);
    if (!legacyId) {
      console.warn(
        [
          "Attention: To help improve Alchemy, we collect anonymous usage, performance, and error data.",
          "You can opt out by setting the ALCHEMY_TELEMETRY_DISABLED or DO_NOT_TRACK environment variable to a truthy value.",
        ].join("\n"),
      );
    }
    return id;
  } catch {
    return null;
  }
}

async function getRootCommitHash() {
  return new Promise<string | null>((resolve) => {
    const command =
      process.platform === "win32"
        ? `git rev-list --max-parents=0 HEAD | ForEach-Object { if (-not (git cat-file -p $_ | Select-String "^parent ")) { $_ } }`
        : `git rev-list --max-parents=0 HEAD | xargs -r -I{} sh -c 'git cat-file -p {} | grep -q "^parent " || echo {}'`;
    exec(command, (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function getGitOriginUrlHash() {
  return new Promise<string | null>((resolve) => {
    exec("git config --get remote.origin.url", (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(hashString(stdout.trim()));
    });
  });
}

async function getBranchName() {
  return new Promise<string | null>((resolve) => {
    exec("git rev-parse --abbrev-ref HEAD", (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function getRuntime() {
  if (globalThis.Bun) return { name: "bun", version: Bun.version };
  // @ts-expect-error
  if (globalThis.Deno)
    // @ts-expect-error
    return { name: "deno", version: Deno.version?.deno ?? null };
  // @ts-expect-error
  if (globalThis.EdgeRuntime) return { name: "workerd", version: null };
  if (globalThis.process?.versions?.node)
    return { name: "node", version: process.versions.node };
  return { name: null, version: null };
}

const PROVIDERS = [
  { env: "GITHUB_ACTIONS", provider: "GitHub Actions", isCI: true },
  { env: "GITLAB_CI", provider: "GitLab CI", isCI: true },
  { env: "CIRCLECI", provider: "CircleCI", isCI: true },
  { env: "JENKINS_URL", provider: "Jenkins", isCI: true },
  { env: "TRAVIS", provider: "Travis CI", isCI: true },
  { env: "NOW_BUILDER", provider: "Vercel", isCI: true },
  { env: "VERCEL", provider: "Vercel", isCI: false },
] as const;

function getEnvironment() {
  for (const provider of PROVIDERS) {
    if (process.env[provider.env]) {
      return {
        provider: provider.provider,
        isCI: provider.isCI,
      };
    }
  }
  return {
    provider: null,
    isCI: !!process.env.CI,
  };
}

export const collectData = memoize(async (): Promise<GenericTelemetryData> => {
  const [
    userId,
    rootCommitHash,
    gitOriginUrlHash,
    branchHash,
    runtime,
    environment,
  ] = await Promise.all([
    getOrCreateUserId(),
    getRootCommitHash(),
    getGitOriginUrlHash(),
    getBranchName().then(hashString),
    getRuntime(),
    getEnvironment(),
  ]);
  return {
    userId: userId ?? "",
    sessionId: crypto.randomUUID(),
    platform: os.platform(),
    osVersion: os.release(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / 1024 / 1024),
    rootCommitHash: rootCommitHash ?? "",
    gitOriginUrl: gitOriginUrlHash ?? "",
    gitBranchHash: branchHash ?? "",
    runtime: runtime.name ?? "",
    runtimeVersion: runtime.version ?? "",
    ciProvider: environment.provider ?? "",
    isCI: environment.isCI,
    alchemyVersion: pkg.version,
  };
});

export type GenericTelemetryData = {
  userId: string;
  sessionId: string;
  platform: string;
  osVersion: string;
  arch: string;
  cpus: number;
  memory: number;
  rootCommitHash: string;
  gitOriginUrl: string;
  gitBranchHash: string;
  runtime: string;
  runtimeVersion: string;
  ciProvider: string;
  isCI: boolean;
  alchemyVersion: string;
};

export type ErrorData = {
  errorTag: string;
  errorMessage: string;
  errorStack: string;
};

export type CliTelemetryData = {
  command: string;
  event: "cli.start" | "cli.success" | "cli.error";
};

export type ResourceTelemetryData = {
  phase: Phase;
  event:
    | "resource.start"
    | "resource.success"
    | "resource.error"
    | "resource.skip"
    | "resource.read";
  resource: string;
  status:
    | "creating"
    | "created"
    | "updating"
    | "updated"
    | "deleting"
    | "deleted"
    | "unknown";
  duration: number;
  replaced: boolean;
};

export type StateStoreTelemetryData = {
  event:
    | "statestore.init"
    | "statestore.deinit"
    | "statestore.list"
    | "statestore.count"
    | "statestore.get"
    | "statestore.getBatch"
    | "statestore.all"
    | "statestore.set"
    | "statestore.delete";
  stateStore: string;
  duration: number;
};

export type AlchemyTelemetryData = {
  event: "alchemy.start" | "alchemy.success" | "alchemy.error";
  duration: number;
};

async function isTelemetryDisabled() {
  return (
    Scope.getScope()?.noTrack ||
    TELEMETRY_DISABLED ||
    (await getGlobalTelemetryDisabled())
  );
}

export async function createAndSendEvent(
  data:
    | CliTelemetryData
    | ResourceTelemetryData
    | StateStoreTelemetryData
    | AlchemyTelemetryData,
  error?: Error,
) {
  if (await isTelemetryDisabled()) {
    return;
  }
  try {
    const eventData = {
      ...data,
      ...("duration" in data
        ? { duration: Math.round(data.duration * 1000) }
        : {}),
      ...(await collectData()),
      ...serializeError(error),
    };
    await fetch(TELEMETRY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });
  } catch (error) {
    if (!SUPPRESS_TELEMETRY_ERRORS) {
      logger.warn("Failed to send telemetry event:", error);
    }
  }
}

async function hashString(input: string | null): Promise<string | null> {
  if (input == null) {
    return null;
  }
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function serializeError(error: Error | undefined) {
  if (error instanceof Error) {
    return {
      errorTag: error.name ?? "",
      errorMessage: error.message?.replaceAll(os.homedir(), "~") ?? "", // redact home directory
      errorStack: error.stack?.replaceAll(os.homedir(), "~") ?? "",
    };
  }
  return {
    errorTag: "",
    errorMessage: "",
    errorStack: "",
  };
}
