import fs from "node:fs/promises";
import path from "pathe";

export async function findWorkspaceRoot(dir: string = process.cwd()) {
  if ((await fs.stat(dir)).isDirectory()) {
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
  fs
    .readFile(path.join(...p), "utf8")
    .then(JSON.parse)
    .catch(() => undefined);

const exists = (...p: string[]) =>
  fs
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
