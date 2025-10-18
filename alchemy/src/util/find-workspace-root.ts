import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "pathe";

export function findWorkspaceRootSync(dir: string = process.cwd()) {
  if (fs.statSync(dir).isDirectory()) {
    if (fs.existsSync(path.join(dir, ".git"))) {
      return dir;
    } else if (readSync(dir, "package.json")?.workspaces) {
      return dir;
    } else if (rootFiles.some((file) => fs.existsSync(path.join(dir, file)))) {
      return dir;
    }
  }
  return findWorkspaceRootSync(path.resolve(dir, ".."));
}

export async function findWorkspaceRoot(dir: string = process.cwd()) {
  if ((await fsp.stat(dir)).isDirectory()) {
    if (await exists(dir, ".git")) {
      // the root of the git repo is usually the workspace root and we should always stop here
      return dir;
    } else if ((await read(dir, "package.json"))?.workspaces) {
      // package.json with workspaces (bun, npm, etc.)
      return dir;
    } else if (await anyExists(dir, ...rootFiles)) {
      return dir;
    }
  }
  return findWorkspaceRoot(path.resolve(dir, ".."));
}

const read = (...p: string[]): Promise<any> =>
  fsp
    .readFile(path.join(...p), "utf8")
    .then(JSON.parse)
    .catch(() => undefined);

const readSync = (...p: string[]): any => {
  try {
    return JSON.parse(fs.readFileSync(path.join(...p), "utf8"));
  } catch {
    return undefined;
  }
};

const exists = (...p: string[]) =>
  fsp
    .access(path.join(...p))
    .then(() => true)
    .catch(() => false);

const anyExists = (base: string, ...files: string[]) =>
  Promise.all(files.map((file) => exists(base, file))).then((results) =>
    results.some(Boolean),
  );

const rootFiles = [
  // pnpm
  "pnpm-workspace.yaml",
  "pnpm-workspace.yml",
  // lerna
  "lerna.json",
  // nx
  "nx.json",
  // turbo
  // "turbo.json",
  // rush
  "rush.json",
];
