import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "pathe";
import { exists } from "./exists.ts";

export async function findWorkspaceRoot(
  directory: string = process.cwd(),
): Promise<string> {
  const checks = await Promise.all(
    Object.entries(predicates).map(async ([file, predicate]) => {
      return await check(path.join(directory, file), predicate);
    }),
  );
  if (checks.includes(true)) {
    return directory;
  }
  const parent = path.resolve(directory, "..");
  if (parent === directory) {
    // Bail if we've reached the filesystem root to avoid infinite recursion
    return directory;
  }
  return await findWorkspaceRoot(parent);
}

export function findWorkspaceRootSync(
  directory: string = process.cwd(),
): string {
  for (const [file, predicate] of Object.entries(predicates)) {
    const filePath = path.join(directory, file);
    if (checkSync(filePath, predicate)) {
      return directory;
    }
  }
  const parent = path.resolve(directory, "..");
  if (parent === directory) {
    // Bail if we've reached the filesystem root to avoid infinite recursion
    return directory;
  }
  return findWorkspaceRootSync(parent);
}

async function check(filePath: string, predicate: Predicate) {
  if (!(await exists(filePath))) {
    return false;
  }

  if (typeof predicate === "function") {
    try {
      const value = await fsp.readFile(filePath, "utf-8");
      const json = JSON.parse(value);
      return predicate(json);
    } catch {
      return false;
    }
  } else {
    return true;
  }
}

function checkSync(filePath: string, predicate: Predicate) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  if (typeof predicate === "function") {
    try {
      const value = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(value);
      return predicate(json);
    } catch {
      return false;
    }
  } else {
    return predicate;
  }
}

type Predicate = true | ((value: Record<string, unknown>) => boolean);

const predicates: Record<string, Predicate> = {
  // bun
  "bun.lock": true,
  "bun.lockb": true,

  // git
  ".git": true,

  // lerna
  "lerna.json": true,

  // npm
  "package.json": (value) => "workspaces" in value,
  "package-lock.json": true,

  // nx
  "nx.json": true,

  // pnpm
  "pnpm-lock.yaml": true,
  "pnpm-workspace.yaml": true,
  "pnpm-workspace.yml": true,

  // rush
  "rush.json": true,

  // turbo
  // (a monorepo can contain more than one turbo.json, but unless it's the root, it must contain the `extends` property)
  "turbo.json": (value) => !("extends" in value),

  // yarn
  "yarn.lock": true,
};
