import alchemy from "alchemy";
import { Exec } from "alchemy/os";
import { Branch, Database, Password } from "alchemy/planetscale";

const app = await alchemy("planetscale-drizzle");

//todo(michael): we may want to add other resources (cf hyperdrive?) so it makes sense why we put this in a scope
const database = await Database("Database", {
  adopt: true,
  name: "sample-database",
  region: {
    slug: "us-east",
  },
  clusterSize: "PS_10",
  allowDataBranching: true,
  automaticMigrations: true,
  requireApprovalForDeploy: false,
  defaultBranch: "main",
  migrationFramework: "other",
  migrationTableName: "__drizzle_migrations",
});

const branch = await Branch("Branch", {
  adopt: true,
  name: `${app.name}-${app.stage}-branch`,
  database,
  parentBranch: database.defaultBranch,
  isProduction: false,
  safeMigrations: !app.local,
});

const password = await Password("Password", {
  name: `${app.name}-${app.stage}-password`,
  organization: database.organization,
  database,
  branch,
  role: "admin",
});

await Exec("DrizzleGenerate", {
  command: "bun run db:generate",
  env: {
    DATABASE_NAME: database.name,
    DATABASE_HOST: password.host,
    DATABASE_USERNAME: password.username,
    DATABASE_PASSWORD: password.password,
  },
});

await Exec("DrizzleMigrate", {
  command:
    process.platform === "win32"
      ? //* gracefully handle no migrations (drizzle exits with error code 9)
        `cmd /C "bun run db:migrate || if %ERRORLEVEL%==9 exit 0 else exit %ERRORLEVEL%"`
      : `sh -c 'bun run db:migrate || ( [ $? -eq 9 ] && exit 0 ); exit $?'`,
  env: {
    DATABASE_NAME: database.name,
    DATABASE_HOST: password.host,
    DATABASE_USERNAME: password.username,
    DATABASE_PASSWORD: password.password,
  },
});

if (app.local) {
  Exec("DrizzleStudio", {
    command: "bun run db:studio",
    env: {
      DATABASE_NAME: database.name,
      DATABASE_HOST: password.host,
      DATABASE_USERNAME: password.username,
      DATABASE_PASSWORD: password.password,
    },
  });
}
console.log(database);

await app.finalize();
