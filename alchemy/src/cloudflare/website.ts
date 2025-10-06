import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import { Exec } from "../os/index.ts";
import { Scope } from "../scope.ts";
import { dedent } from "../util/dedent.ts";
import { logger } from "../util/logger.ts";
import { Assets } from "./assets.ts";
import type { Bindings } from "./bindings.ts";
import { DEFAULT_COMPATIBILITY_DATE } from "./compatibility-date.gen.ts";
import { unionCompatibilityFlags } from "./compatibility-presets.ts";
import { writeMiniflareSymlink } from "./miniflare/symlink-miniflare-state.ts";
import {
  extractStringAndSecretBindings,
  unencryptSecrets,
} from "./util/filter-env-bindings.ts";
import { type AssetsConfig, Worker, type WorkerProps } from "./worker.ts";
import { WranglerJson, type WranglerJsonSpec } from "./wrangler.json.ts";

export interface WebsiteProps<B extends Bindings>
  extends Omit<WorkerProps<B>, "assets" | "dev"> {
  /**
   * Configuration for the build command
   *
   * If not provided, the build is assumed to have already happened.
   */
  build?:
    | string
    | {
        /**
         * The command to run to build the site
         */
        command?: string;
        /**
         * Additional environment variables to set when running the build command
         */
        env?: Record<string, string>;
        /**
         * Whether to memoize the command (only re-run if the command changes)
         *
         * When set to `true`, the command will only be re-executed if the command string changes.
         *
         * When set to an object with `patterns`, the command will be re-executed if either:
         * 1. The command string changes, or
         * 2. The contents of any files matching the glob patterns change
         *
         * ⚠️ **Important Note**: When using memoization with build commands, the build outputs
         * will not be produced if the command is memoized. This is because the command is not
         * actually executed when memoized. Consider disabling memoization in CI environments:
         *
         * @example
         * // Disable memoization in CI to ensure build outputs are always produced
         * await Website("my-website", {
         *   command: "vite build",
         *   memoize: process.env.CI ? false : {
         *     patterns: ["./src/**"]
         *   }
         * });
         *
         * @default false
         */
        memoize?: boolean | { patterns: string[] };
      };
  /**
   * Configuration for the dev command
   */
  dev?:
    | string
    | {
        /**
         * The command to run to start the dev server
         */
        command?: string;
        /**
         * Additional environment variables to set when running the dev command
         */
        env?: Record<string, string>;
      };
  /**
   * The directory containing static assets
   *
   * @default dist
   */
  assets?: string | ({ directory?: string } & AssetsConfig);
  /**
   * Configures default routing to support client-side routing for Single Page Applications (SPA)
   *
   * @default false
   */
  spa?: boolean;
  /**
   * Configuration for the wrangler.json file
   */
  wrangler?: {
    /**
     * Path to the wrangler.json file
     *
     * @default .alchemy/local/wrangler.jsonc
     */
    path?: string;
    /**
     * The main entry point for the worker
     *
     * @default worker.entrypoint
     */
    main?: string;
    /**
     * Hook to modify the wrangler.json object before it's written
     *
     * This function receives the generated wrangler.json spec and should return
     * a modified version. It's applied as the final transformation before the
     * file is written to disk.
     *
     * @param spec - The generated wrangler.json specification
     * @returns The modified wrangler.json specification
     */
    transform?: (
      spec: WranglerJsonSpec,
    ) => WranglerJsonSpec | Promise<WranglerJsonSpec>;
    /**
     * Whether to include secrets in the wrangler.json file
     *
     * @default true if no path is specified, false otherwise
     */
    secrets?: boolean;
  };

  /**
   * The command to run to build the site.
   * @deprecated Use `build` or `build.command` instead
   */
  command?: string;
  /**
   * Additional environment variables to set when running the build command.
   * @deprecated Use `build.env` instead
   */
  commandEnv?: Record<string, string>;
  /**
   * Whether to memoize the command (only re-run if the command changes)
   * @deprecated Use `build.memoize` instead
   */
  memoize?: boolean | { patterns: string[] };
}

export type Website<B extends Bindings> = B extends { ASSETS: any }
  ? never
  : Worker<B & { ASSETS: Assets }>;

export async function Website<B extends Bindings>(
  id: string,
  props: WebsiteProps<B>,
) {
  const {
    name = Scope.current.createPhysicalName(id),
    build: buildProps,
    assets,
    dev,
    script,
    spa = true,
    command,
    commandEnv,
    memoize,
    ...workerProps
  } = props;

  assert(
    !workerProps.bindings?.ASSETS,
    "ASSETS binding is reserved for internal use",
  );
  if (command) {
    logger.warnOnce(
      "[website] The `command` prop is deprecated. Use `build.command` instead.",
    );
  }
  if (commandEnv) {
    logger.warnOnce(
      "[website] The `commandEnv` prop is deprecated. Use `build.env` instead.",
    );
  }
  if (memoize) {
    logger.warnOnce(
      "[website] The `memoize` prop is deprecated. Use `build.memoize` instead.",
    );
  }

  const build = (() => {
    if (typeof buildProps === "string") {
      return { command: buildProps, env: commandEnv, memoize };
    }
    if (buildProps) {
      return buildProps;
    }
    if (command) {
      return {
        command,
        env: commandEnv,
        memoize,
      };
    }
    return undefined;
  })();
  const paths = (() => {
    const cwd = props.cwd ?? process.cwd();
    return {
      cwd,
      assets: path.resolve(
        cwd,
        typeof assets === "string" ? assets : (assets?.directory ?? "dist"),
      ),
      local: path.resolve(cwd, ".alchemy/local"),
      entrypoint: path.resolve(
        cwd,
        props.entrypoint ?? ".alchemy/local/worker.js",
      ),
      get wrangler() {
        return {
          path: path.resolve(
            cwd,
            props.wrangler?.path ?? ".alchemy/local/wrangler.jsonc",
          ),
          main: props.wrangler?.main
            ? path.resolve(cwd, props.wrangler.main)
            : this.entrypoint,
        };
      },
    };
  })();
  const secrets = props.wrangler?.secrets ?? !props.wrangler?.path;
  const env = {
    ...(process.env ?? {}),
    ...(props.env ?? {}),
    ...extractStringAndSecretBindings(props.bindings ?? {}, secrets),
  };
  const worker = {
    ...workerProps,
    name,
    cwd: path.relative(process.cwd(), paths.cwd),
    compatibilityFlags: unionCompatibilityFlags(
      workerProps.compatibility,
      workerProps.compatibilityFlags,
    ),
    compatibilityDate:
      workerProps.compatibilityDate ?? DEFAULT_COMPATIBILITY_DATE,
    assets: {
      html_handling: "auto-trailing-slash",
      not_found_handling: spa ? "single-page-application" : "none",
      run_worker_first: false,
      ...(typeof props.assets === "string" ? {} : props.assets),
    },
    entrypoint: path.relative(paths.cwd, paths.entrypoint),
  } as WorkerProps<B> & { name: string };

  if (!workerProps.entrypoint) {
    await fs.mkdir(path.dirname(paths.entrypoint), { recursive: true });
    const content =
      script ??
      dedent`
      export default {
          async fetch(request, env) {
              return new Response("Not Found", { status: 404 });
          },
      };`;
    await fs.writeFile(paths.entrypoint, content);
  }

  if (Scope.current.local) {
    await writeMiniflareSymlink(Scope.current.rootDir, paths.cwd);
  }

  await WranglerJson({
    path: path.relative(paths.cwd, paths.wrangler.path),
    worker,
    assets: {
      binding: "ASSETS",
      directory: path.relative(paths.cwd, paths.assets),
    },
    main: path.relative(paths.cwd, paths.wrangler.main),
    secrets,
    transform: {
      wrangler: props.wrangler?.transform,
    },
  });

  const scope = Scope.current;

  if (build?.command && !scope.local) {
    await Exec(`${id}-build`, {
      cwd: path.relative(process.cwd(), paths.cwd),
      command: build.command,
      env: {
        ...env,
        ...(typeof build === "object" ? build.env : {}),
        NODE_ENV: "production",
        ALCHEMY_ROOT: Scope.current.rootDir,
      },
      memoize: typeof build === "object" ? build.memoize : undefined,
    });
  }

  let url: string | undefined;
  const devCommand = typeof dev === "string" ? dev : dev?.command;
  if (devCommand && scope.local) {
    url = await scope.spawn(name, {
      cmd: devCommand,
      cwd: paths.cwd,
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
        // NOTE: we must set this to ensure the user does not accidentally set `NODE_ENV=production`
        // which breaks `vite dev` (it won't, for example, re-write `process.env.TSS_APP_BASE` in the `.js` client side bundle)
        NODE_ENV: "development",
        ALCHEMY_ROOT: Scope.current.rootDir,
      },
    });
  }

  return (await Worker(id, {
    ...worker,
    bindings: {
      ...worker.bindings,
      ...(!scope.local
        ? {
            ASSETS: await Assets({
              path: path.relative(process.cwd(), paths.assets),
            }),
          }
        : {}),
    },
    dev: url ? { url } : undefined,
  })) as Website<B>;
}

export const spreadBuildProps = (
  props: { build?: WebsiteProps<Bindings>["build"] } | undefined,
  defaultCommand: string,
): WebsiteProps<Bindings>["build"] => {
  if (typeof props?.build === "object") {
    return {
      ...props.build,
      command: props.build.command ?? defaultCommand,
    };
  }
  return props?.build ?? defaultCommand;
};

export const spreadDevProps = (
  props: { dev?: WebsiteProps<Bindings>["dev"] } | undefined,
  defaultCommand: string,
): Exclude<WebsiteProps<Bindings>["dev"], undefined> => {
  if (typeof props?.dev === "object") {
    return {
      ...props.dev,
      command: props.dev.command ?? defaultCommand,
    };
  }
  return props?.dev ?? defaultCommand;
};
