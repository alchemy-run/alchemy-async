import * as mf from "miniflare";
import type { D1SqlFile } from "./d1-sql-file.ts";
import { getDefaultPersistPath } from "./miniflare/paths.ts";

export interface D1LocalMigrationOptions {
  rootDir: string;
  databaseId: string;
  migrationsTable: string;
  migrations: Array<D1SqlFile>;
  imports: Array<D1SqlFile>;
}

export const applyLocalD1Migrations = async (
  options: D1LocalMigrationOptions,
) => {
  const miniflare = new mf.Miniflare({
    script: "",
    modules: true,
    defaultPersistRoot: getDefaultPersistPath(options.rootDir),
    d1Persist: true,
    d1Databases: { DB: options.databaseId },
    log: process.env.DEBUG ? new mf.Log(mf.LogLevel.DEBUG) : undefined,
  });
  try {
    await miniflare.ready;
    const db = await miniflare.getD1Database("DB");
    const session = db.withSession("first-primary");
    const tableInfo = await session
      .prepare(`PRAGMA table_info(${options.migrationsTable});`)
      .all<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }>();
    if (tableInfo.results.length === 0) {
      await session
        .prepare(
          `CREATE TABLE ${options.migrationsTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        type TEXT NOT NULL
    )`,
        )
        .run();
    } else if (!tableInfo.results.some((col) => col.name === "type")) {
      await session
        .prepare(
          `ALTER TABLE ${options.migrationsTable} ADD COLUMN type TEXT NOT NULL DEFAULT 'migration';`,
        )
        .run();
    }
    const applied: {
      results: { name: string; type: "migration" | "import" }[];
    } = await session
      .prepare(
        `SELECT name, type FROM ${options.migrationsTable} ORDER BY applied_at ASC`,
      )
      .all();
    const insertRecord = session.prepare(
      `INSERT INTO ${options.migrationsTable} (name, type) VALUES (?, ?)`,
    );
    for (const { id, sql } of options.migrations) {
      if (applied.results.some((m) => m.name === id)) {
        continue;
      }
      const statements = sql
        .split("--> statement-breakpoint")
        .filter((s) => s.trim())
        .map((s) => session.prepare(s));
      statements.push(insertRecord.bind(id, "migration"));
      await session.batch(statements);
    }
    for (const { id, sql, hash } of options.imports) {
      const name = `${id}-${hash}`;
      if (applied.results.some((m) => m.name === name)) {
        continue;
      }
      // Split into statements to prevent D1_ERROR: statement too long: SQLITE_TOOBIG.
      // This is split naively by semicolons followed by newlines - not perfect but should work 99% of the time.
      const statements = sql
        .split(/;\r?\n/)
        .filter((s) => s.trim())
        .map((s) => session.prepare(s));
      statements.push(insertRecord.bind(name, "import"));
      await session.batch(statements);
    }
  } finally {
    await miniflare.dispose();
  }
};
