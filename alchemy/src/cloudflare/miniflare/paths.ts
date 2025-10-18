import { AsyncLocalStorage } from "node:async_hooks";
// biome-ignore lint/style/noRestrictedImports: I/O is acceptable here
import { existsSync } from "node:fs";
import path from "pathe";
import { findWorkspaceRootSync } from "../../util/find-workspace-root.ts";
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
  const workspaceRoot = findWorkspaceRootSync(rootDir);
  return path.join(workspaceRoot, ".alchemy", "miniflare", "v3");
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
