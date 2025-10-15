/// <reference types="@types/node" />

import alchemy from "alchemy";
import { Hyperdrive, Worker } from "alchemy/cloudflare";
import { Exec } from "alchemy/os";
import { Database, Role } from "alchemy/planetscale";

const app = await alchemy("planetscale-drizzle");

const database = await Database("Database", {
  name: "sample-database",
  clusterSize: "PS_10",
  kind: "postgresql",
});

const role = await Role("Role", {
  database,
  branch: database.defaultBranch,
  inheritedRoles: ["postgres"],
});

const hyperdrive = await Hyperdrive("Hyperdrive", {
  origin: role.connectionUrl,
  caching: { disabled: true },
});

await Exec("DrizzleGenerate", {
  command: "bun run db:generate",
  env: {
    DATABASE_URL: role.connectionUrl,
  },
  memoize: {
    patterns: ["drizzle.config.ts", "src/schema.ts"],
  },
});

await Exec("DrizzleMigrate", {
  command:
    process.platform === "win32"
      ? //* gracefully handle no migrations (drizzle exits with error code 9)
        `cmd /C "bun run db:migrate || if %ERRORLEVEL%==9 exit 0 else exit %ERRORLEVEL%"`
      : `sh -c 'bun run db:migrate || ( [ $? -eq 9 ] && exit 0 ); exit $?'`,
  env: {
    DATABASE_URL: role.connectionUrl,
  },
  memoize: {
    patterns: ["drizzle.config.ts", "drizzle/*.sql"],
  },
});

export const worker = await Worker("Worker", {
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    HYPERDRIVE: hyperdrive,
  },
});

if (app.local) {
  Exec("DrizzleStudio", {
    command: "bun run db:studio",
    env: {
      DATABASE_URL: role.connectionUrl,
    },
  });
}
console.log(worker.url);

await app.finalize();
