import fs from "node:fs/promises";
import path from "pathe";
import { Scope } from "../../scope.ts";
import { exists } from "../../util/exists.ts";
import type { Bindings } from "../bindings.ts";
import {
  extractStringAndSecretBindings,
  unencryptSecrets,
} from "../util/filter-env-bindings.ts";
import {
  spreadBuildProps,
  spreadDevProps,
  Website,
  type WebsiteProps,
} from "../website.ts";

export interface BunSPAProps<B extends Bindings> extends WebsiteProps<B> {
  /**
   * The path to the frontend entrypoints that bun should bundle for deployment & serve in dev mode.
   * These are usually html files. Glob patterns are supported.
   * Typically set to src/index.html
   */
  frontend: string | string[];
  outDir?: string;
}

export type BunSPA<B extends Bindings> = Website<B> & { apiUrl: string };

export async function BunSPA<B extends Bindings>(
  id: string,
  props: BunSPAProps<B>,
): Promise<BunSPA<B> & { apiUrl: string }> {
  const frontendPaths = Array.isArray(props.frontend)
    ? props.frontend.map((p) => path.resolve(p))
    : [path.resolve(props.frontend)];

  // Helper to check if a path contains glob patterns
  const isGlobPattern = (p: string) =>
    p.includes("*") || p.includes("?") || p.includes("[") || p.includes("]");

  // Only validate non-glob paths
  const nonGlobPaths = frontendPaths.filter((p) => !isGlobPattern(p));

  if (nonGlobPaths.length > 0) {
    const existsPromises = nonGlobPaths.map((p) => exists(p));
    const existsResults = await Promise.all(existsPromises);
    const missingPaths = nonGlobPaths.filter((_p, i) => !existsResults[i]);
    if (missingPaths.length > 0) {
      if (missingPaths.length === 1) {
        throw new Error(`Frontend path ${missingPaths[0]} does not exist`);
      }
      throw new Error(`Frontend paths ${missingPaths.join(", ")} do not exist`);
    }

    const statsPromises = nonGlobPaths.map((p) => fs.stat(p));
    const statsResults = await Promise.all(statsPromises);
    const notFiles = nonGlobPaths.filter((_, i) => !statsResults[i].isFile());
    if (notFiles.length > 0) {
      if (notFiles.length === 1) {
        throw new Error(`Frontend path ${notFiles[0]} is not a file`);
      }
      throw new Error(`Frontend paths ${notFiles.join(", ")} are not files`);
    }
  }

  const outDir = path.resolve(props.outDir ?? "dist/client");

  if (props.assets) {
    throw new Error("assets are not supported in BunSPA");
  }

  const scope = Scope.current;
  const nodeEnv =
    (props.bindings?.NODE_ENV ?? scope.local) ? "development" : "production";
  console.log("creating website", outDir);
  const website = await Website(id, {
    spa: true,
    ...props,
    bindings: {
      ...props.bindings,
      // set NODE_ENV in worker appropriately if not already set
      NODE_ENV: nodeEnv,
    } as unknown as B,
    assets: {
      directory: path.resolve(outDir),
    },
    build: spreadBuildProps(
      props,
      `bun build '${frontendPaths.join("' '")}' --target=browser --minify --define:process.env.NODE_ENV='"${nodeEnv}"' --env='BUN_PUBLIC_*' --outdir ${outDir}`,
    ),
  });

  let apiUrl = website.url!;
  // in dev
  if (scope.local) {
    const cwd = props.cwd ?? process.cwd();
    await validateBunfigToml(cwd);
    const frontendPathsRelativeToCwd = frontendPaths.map((p) =>
      path.relative(cwd, p),
    );
    const dev = spreadDevProps(
      props,
      `bun '${frontendPathsRelativeToCwd.join("' '")}'`,
    );
    const secrets = props.wrangler?.secrets ?? !props.wrangler?.path;
    const env = {
      ...(process.env ?? {}),
      ...(props.env ?? {}),
      ...extractStringAndSecretBindings(props.bindings ?? {}, secrets),
    };
    website.url = await scope.spawn(website.name, {
      cmd: typeof dev === "string" ? dev : dev.command!,
      cwd,
      extract: (line) => {
        const URL_REGEX =
          /http:\/\/(localhost|0\.0\.0\.0|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+\/?/;
        const match = line
          .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "")
          .match(URL_REGEX);
        if (match) {
          return match[0];
        }
      },
      env: {
        ...unencryptSecrets(env ?? {}),
        ...(typeof dev === "object" ? dev.env : {}),
        FORCE_COLOR: "1",
        ...process.env,
        NODE_ENV: "development",
        ALCHEMY_ROOT: Scope.current.rootDir,
        BUN_PUBLIC_BACKEND_URL: apiUrl,
      },
    });
  }
  return { ...website, apiUrl } as BunSPA<B>;
}

async function validateBunfigToml(cwd: string): Promise<void> {
  const bunfigPath = path.join(cwd, "bunfig.toml");

  if (!(await exists(bunfigPath))) {
    throw new Error(
      "bunfig.toml is required for BunSPA to work correctly.\n\n" +
        `Create ${bunfigPath} with the following content:\n\n` +
        "[serve.static]\n" +
        `env='BUN_PUBLIC_*'\n\n` +
        "This allows Bun to expose BUN_PUBLIC_* environment variables to the frontend during development.",
    );
  }

  const content = await fs.readFile(bunfigPath, "utf-8");
  const config = Bun.TOML.parse(content) as Record<string, any>;

  const hasServeStatic = config.serve?.static;
  const hasEnvConfig =
    hasServeStatic && config.serve.static.env === "BUN_PUBLIC_*";

  if (!hasServeStatic || !hasEnvConfig) {
    throw new Error(
      "bunfig.toml is missing required configuration for BunSPA.\n\n" +
        `Add the following section to ${bunfigPath}:\n\n` +
        "[serve.static]\n" +
        `env='BUN_PUBLIC_*'\n\n` +
        "This allows Bun to expose BUN_PUBLIC_* environment variables to the frontend during development.",
    );
  }
}
