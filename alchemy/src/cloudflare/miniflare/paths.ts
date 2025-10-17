import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, readlinkSync, statSync } from "node:fs";
import path from "pathe";
import { ALCHEMY_ROOT } from "../../util/root-dir.ts";

const dynamicImportContext = new AsyncLocalStorage<boolean>();

/**
 * Used to disable path validation during dynamic imports.
 */
export const withSkipPathValidation = <T>(callback: () => T) => {
  return dynamicImportContext.run(true, callback);
};

export const getDefaultConfigPath = (rootDir: string = process.cwd()) => {
  return path.join(rootDir, ".alchemy", "local", "wrangler.jsonc");
};

export const getDefaultPersistPath = (rootDir: string = ALCHEMY_ROOT) => {
  return path.join(rootDir, ".alchemy", "miniflare", "v3");
};

export const validateConfigPath = (path: string, throws = true) => {
  if (!existsSync(path)) {
    warnOrThrow(
      `The Wrangler config path, "${path}", could not be found. Please run \`alchemy dev\` or \`alchemy deploy\` to create it.`,
      throws,
    );
  }
  return path;
};

const DEFAULT_VALIDATE_PERSIST =
  process.env.NODE_ENV === "development" ||
  !process.argv.some((arg) => ["build", "prepare", "typegen"].includes(arg));

export const validatePersistPath = (
  path: string,
  throws = DEFAULT_VALIDATE_PERSIST,
) => {
  try {
    const stat = statSync(path);
    if (stat.isSymbolicLink()) {
      return readlinkSync(path);
    }
    return path;
  } catch {
    warnOrThrow(
      `The Alchemy data path, "${path}", could not be resolved. This is required for Cloudflare bindings during development. Please run \`alchemy dev\` to create it.`,
      throws,
    );
    return path;
  }
};

const warned = new Set<string>();

const warnOrThrow = (message: string, throws: boolean) => {
  if (dynamicImportContext.getStore()) {
    return;
  }
  if (throws) {
    throw new Error(message);
  }
  if (!warned.has(message)) {
    console.warn(message);
    warned.add(message);
  }
};
