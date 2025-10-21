import * as fs from "node:fs/promises";
import path from "pathe";
import pc from "picocolors";
import { getPackageManagerRunner } from "../util/detect-package-manager.ts";
import { exists } from "../util/exists.ts";
import ignore from "../util/ignore-matcher.ts";
import { logger } from "../util/logger.ts";
import type { Assets } from "./assets.ts";
import type { Bindings } from "./bindings.ts";
import { Website, type WebsiteProps } from "./website.ts";
import type { Worker } from "./worker.ts";

export interface NextjsProps<B extends Bindings> extends WebsiteProps<B> {}

export type Nextjs<B extends Bindings> = B extends { ASSETS: any }
  ? never
  : Worker<B & { ASSETS: Assets }>;

export async function Nextjs<const B extends Bindings>(
  id: string,
  props: NextjsProps<B> = {},
): Promise<Nextjs<B>> {
  const runner = await getPackageManagerRunner();
  const isIgnored = await isFileIgnored("wrangler.jsonc", props.cwd);
  if (!isIgnored) {
    logger.warn(
      [
        pc.bold(
          `The ${pc.cyan("wrangler.jsonc")} file for Next.js ${pc.cyan(`"${id}"`)} is not ignored.`,
        ),
        "This may cause unexpected behavior. Please add the file to your .gitignore.",
      ].join(" "),
    );
  }
  return await Website(id, {
    bundle: {
      minify: true,
    },
    ...props,
    entrypoint: props.entrypoint ?? ".open-next/worker.js",
    wrangler: {
      path: "wrangler.jsonc",
      secrets: isIgnored,
      ...(props.wrangler ?? {}),
    },
    build: normalizeCommand(props.build, {
      command: `${runner} opennextjs-cloudflare build`,
      env: {
        NEXTJS_ENV: "production",
      },
    }),
    dev: normalizeCommand(props.dev, {
      command: `${runner} next dev`,
      env: {
        NEXTJS_ENV: "development",
      },
    }),

    // OpenNext generates the files, but relies on us to bundle them.
    noBundle: props.noBundle ?? false,

    spa: false,
    compatibilityFlags: [
      "nodejs_compat",
      "global_fetch_strictly_public",
      ...(props.compatibilityFlags ?? []),
    ],
    assets: props.assets ?? ".open-next/assets",
  });
}

/**
 * Check if a file is ignored by .gitignore.
 *
 * @param filename - The name of the file to check.
 * @param cwd - The current working directory.
 * @returns True if the file is ignored, false otherwise.
 */
const isFileIgnored = async (filename: string, cwd?: string) => {
  const matcher = ignore();

  // Read .gitignore from current directory and walk up the directory tree
  let currentDir = path.resolve(cwd ?? process.cwd());
  const gitignorePatterns: string[] = [];

  while (currentDir !== path.dirname(currentDir)) {
    const gitignorePath = path.join(currentDir, ".gitignore");
    try {
      const gitignoreContent = await fs.readFile(gitignorePath, "utf8");
      // unshift to prioritize local .gitignore
      gitignorePatterns.unshift(
        ...gitignoreContent
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#")),
      );
    } catch {
      // .gitignore doesn't exist in this directory, continue up
    }
    if (await exists(path.join(currentDir, ".git"))) {
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  matcher.add(gitignorePatterns);

  return matcher.ignores(filename);
};

const normalizeCommand = (
  input: WebsiteProps<any>["build"],
  defaults: {
    command: string;
    env: Record<string, string>;
  },
) => {
  return {
    command:
      typeof input === "string" ? input : (input?.command ?? defaults.command),
    env: {
      ...defaults.env,
      ...(typeof input === "object" ? (input?.env ?? {}) : {}),
    },
    memoize: typeof input === "object" ? input?.memoize : undefined,
  } satisfies WebsiteProps<any>["build"];
};
