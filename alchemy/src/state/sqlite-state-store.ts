import type { Config as LibSQLConfig } from "@libsql/client";
import fs from "node:fs/promises";
import path from "pathe";
import type { Scope } from "../scope.ts";
import { exists } from "../util/exists.ts";
import { memoize } from "../util/memoize.ts";
import { importPeer } from "../util/peer.ts";
import { MIGRATIONS_DIRECTORY } from "./migrations.ts";
import { StateStoreProxy } from "./proxy.ts";

interface BunSQLiteStateStoreOptions {
  /**
   * Use `bun:sqlite` to connect to the SQLite database.
   * Requires Bun.
   */
  engine: "bun";
  /**
   * The filename to use for the SQLite database.
   * @default process.env.ALCHEMY_STATE_FILE if set, otherwise ".alchemy/state.sqlite"
   */
  filename?: string;

  // Options are copied from Bun instead of inherited because Bun's type is not exported,
  // and the constructor type isn't an interface so inheritance doesn't work.

  readonly?: boolean;
  create?: boolean;
  readwrite?: boolean;
  safeIntegers?: boolean;
  strict?: boolean;
  dotAlchemy?: string;
}

interface LibSQLStateStoreOptions extends Omit<LibSQLConfig, "url"> {
  /**
   * Use the `@libsql/client` library to connect to the SQLite database.
   * Supported on Node.js and Bun.
   */
  engine: "libsql";
  /**
   * The filename to use for the SQLite database.
   * @default process.env.ALCHEMY_STATE_FILE if set, otherwise ".alchemy/state.sqlite"
   * @note If the `url` option is specified, this option is ignored.
   */
  filename?: string;
  /**
   * The database URL. Overrides the `filename` option.
   *
   * The client supports `libsql:`, `http:`/`https:`, `ws:`/`wss:` and `file:` URL. For more infomation,
   * please refer to the project README:
   *
   * https://github.com/libsql/libsql-client-ts#supported-urls
   */
  url?: string;
  /**
   * The path to the .alchemy directory.
   * @default "./.alchemy"
   */
  dotAlchemy?: string;
}

interface AutoSQLiteStateStoreOptions {
  /**
   * Automatically choose the best SQLite engine based on your environment.
   * @default "auto" - Uses `bun:sqlite` if available, otherwise uses `@libsql/client`.
   */
  engine?: "auto";

  /**
   * The filename to use for the SQLite database.
   * @default ".alchemy/state.sqlite"
   */
  filename?: string;

  /**
   * The path to the .alchemy directory.
   * @default "./.alchemy"
   */
  dotAlchemy?: string;
}

type SQLiteStateStoreOptions =
  | BunSQLiteStateStoreOptions
  | LibSQLStateStoreOptions
  | AutoSQLiteStateStoreOptions;

export class SQLiteStateStore extends StateStoreProxy {
  constructor(
    scope: Scope,
    private options?: SQLiteStateStoreOptions,
  ) {
    super(scope);
  }

  async provision(): Promise<StateStoreProxy.Dispatch> {
    const db = await createDatabase({
      ...(this.options ?? {}),
      dotAlchemy: this.scope.dotAlchemy,
    });
    const { SQLiteStateStoreOperations } = await import("./operations.js");
    const operations = new SQLiteStateStoreOperations(db, {
      chain: this.scope.chain,
    });
    return operations.dispatch.bind(operations);
  }
}

const createDatabase = memoize(
  async (options: SQLiteStateStoreOptions | undefined) => {
    switch (options?.engine) {
      case "bun":
        return await createBunSQLiteDatabase(options);
      case "libsql":
        return await createLibSQLDatabase(options);
      default: {
        return await createDefaultDatabase(
          options?.filename,
          options?.dotAlchemy,
        );
      }
    }
  },
);

async function createDefaultDatabase(
  filename: string | undefined,
  dotAlchemy: string | undefined,
) {
  if ("Bun" in globalThis) {
    return createBunSQLiteDatabase({ engine: "bun", filename, dotAlchemy });
  }
  return createLibSQLDatabase({ engine: "libsql", filename, dotAlchemy });
}

async function createBunSQLiteDatabase(
  options: BunSQLiteStateStoreOptions | undefined,
) {
  if (!("Bun" in globalThis)) {
    throw new Error(
      "[SQLiteStateStore] The `engine: 'bun'` option is only available in Bun. Please use `engine: 'libsql'` instead.",
    );
  }

  const filename =
    options?.filename ??
    process.env.ALCHEMY_STATE_FILE ??
    path.join(options?.dotAlchemy ?? ".alchemy", "state.sqlite");
  await ensureDirectory(filename);
  const { Database } = await import("bun:sqlite");
  const { drizzle } = await importPeer(
    import("drizzle-orm/bun-sqlite"),
    "SQLiteStateStore",
  );
  const { migrate } = await import("drizzle-orm/bun-sqlite/migrator");
  const schema = await import("./schema.js");
  // Bun's constructor throws if we pass in an empty object or if extraneous
  // options are passed in, so here's some ugly destructuring!
  const { engine: _engine, filename: _filename, ...rest } = options ?? {};
  const bunOptions = Object.keys(rest).length > 0 ? rest : undefined;
  const client = new Database(filename, {
    readwrite: true,
    create: true,
    ...bunOptions,
  });
  client.exec("PRAGMA journal_mode = WAL;");
  const db = drizzle(client, {
    schema,
  });
  migrate(db, { migrationsFolder: MIGRATIONS_DIRECTORY });
  return db;
}

async function createLibSQLDatabase(
  options: LibSQLStateStoreOptions | undefined,
) {
  const url =
    options?.url ??
    `file:${options?.filename ?? process.env.ALCHEMY_STATE_FILE ?? path.join(options?.dotAlchemy ?? ".alchemy", "state.sqlite")}`;

  const filename = url.startsWith("file:") ? url.slice(5) : undefined;
  if (filename) {
    await ensureDirectory(filename);
  }
  const { drizzle } = await importPeer(
    import("drizzle-orm/libsql"),
    "SQLiteStateStore",
  );
  const { createClient } = await importPeer(
    import("@libsql/client"),
    "SQLiteStateStore (libsql)",
  );
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  const schema = await import("./schema.js");
  const client = createClient({ url, ...options });
  await client.execute("PRAGMA journal_mode = WAL;");
  const db = drizzle(client, {
    schema,
  });
  await migrate(db, { migrationsFolder: MIGRATIONS_DIRECTORY });
  return db;
}

const ensureDirectory = async (filename: string) => {
  const dir = path.dirname(filename);
  if (!(await exists(dir))) {
    await fs.mkdir(dir, { recursive: true });
  }
};
