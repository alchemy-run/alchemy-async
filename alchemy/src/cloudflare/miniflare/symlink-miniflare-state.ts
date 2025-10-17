import fs from "node:fs/promises";
import path from "pathe";
import { getDefaultPersistPath } from "./paths.ts";

export async function writeMiniflareSymlink(rootDir: string, cwd: string) {
  const target = path.resolve(getDefaultPersistPath(cwd));
  await fs.mkdir(target, { recursive: true });
  if (cwd === rootDir) {
    return;
  }
  const persistPath = path.resolve(cwd, getDefaultPersistPath(rootDir));
  await fs.mkdir(path.dirname(persistPath), { recursive: true });
  await fs.symlink(target, persistPath).catch((e) => {
    if (e.code !== "EEXIST") {
      throw e;
    }
  });
}
