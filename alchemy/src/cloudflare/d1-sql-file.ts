import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "pathe";

export interface D1SqlFile {
  id: string;
  sql: string;
  hash: string;
}

/**
 * Lists SQL files from the directory, sorted by filename.
 * @param directory Directory containing .sql files
 */
export async function listSqlFiles(directory: string): Promise<D1SqlFile[]> {
  const files = await Array.fromAsync(
    fs.glob("**/*.sql", {
      cwd: directory,
    }),
  );

  const sortedFiles = files.sort((a: string, b: string) => {
    const aNum = getPrefix(a);
    const bNum = getPrefix(b);

    if (aNum !== null && bNum !== null) return aNum - bNum;
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;

    return a.localeCompare(b);
  });

  return Promise.all(sortedFiles.map((id) => readSqlFile(directory, id)));
}

export async function readSqlFile(
  directory: string,
  name: string,
): Promise<D1SqlFile> {
  const sql = await fs.readFile(path.resolve(directory, name), "utf-8");
  const hash = crypto.createHash("sha256").update(sql).digest("hex");
  const file: D1SqlFile = { id: name, sql, hash };
  // Make the sql property non-enumerable so it's not included in state. This prevents state store errors caused by large sql files.
  Object.defineProperty(file, "sql", { enumerable: false });
  return file;
}

const getPrefix = (name: string) => {
  const prefix = name.split("_")[0];
  const num = Number.parseInt(prefix, 10);
  return Number.isNaN(num) ? null : num;
};
