import fs from "node:fs/promises";
import path from "node:path";
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
  frontend: string;
  outDir?: string;
}

export type BunSPA<B extends Bindings> = Website<B> & { apiUrl: string };

export async function BunSPA<B extends Bindings>(
  id: string,
  props: BunSPAProps<B>,
): Promise<BunSPA<B> & { apiUrl: string }> {
  const frontendPath = path.resolve(props.frontend);
  if (!(await exists(frontendPath))) {
    throw new Error(`Frontend path ${frontendPath} does not exist`);
  }

  const stats = await fs.stat(frontendPath);
  if (!stats.isFile()) {
    throw new Error(`Frontend path ${frontendPath} is not a file`);
  }
  const outDir = path.resolve(props.outDir ?? "dist/client");

  if (props.assets) {
    throw new Error("assets are not supported in BunSPA");
  }

  const scope = Scope.current;
  console.log("creating website", outDir);
  const website = await Website(id, {
    spa: true,
    ...props,
    bindings: {
      ...props.bindings,
      // set NODE_ENV in worker appropriately if not already set
      NODE_ENV:
        (props.bindings?.NODE_ENV ?? scope.local)
          ? "development"
          : "production",
    } as unknown as B,
    assets: {
      directory: path.resolve(outDir),
    },
    build: spreadBuildProps(
      props,
      `bun build '${frontendPath}' --outdir ${outDir}`,
    ),
  });

  let apiUrl = website.url!;
  // in dev
  if (scope.local) {
    const cwd = props.cwd ?? process.cwd();
    await validateBunfigToml(cwd);
    const dev = spreadDevProps(
      props,
      `bun '${path.relative(cwd, frontendPath)}'`,
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
        PUBLIC_BACKEND_URL: apiUrl,
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
        `env='PUBLIC_*'\n\n` +
        "This allows Bun to expose PUBLIC_* environment variables to the frontend during development.",
    );
  }

  const content = await fs.readFile(bunfigPath, "utf-8");
  const config = Bun.TOML.parse(content) as Record<string, any>;

  const hasServeStatic = config.serve?.static;
  const hasEnvConfig = hasServeStatic && config.serve.static.env === "PUBLIC_*";

  if (!hasServeStatic || !hasEnvConfig) {
    throw new Error(
      "bunfig.toml is missing required configuration for BunSPA.\n\n" +
        `Add the following section to ${bunfigPath}:\n\n` +
        "[serve.static]\n" +
        `env='PUBLIC_*'\n\n` +
        "This allows Bun to expose PUBLIC_* environment variables to the frontend during development.",
    );
  }
}
