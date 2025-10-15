import alchemy from "alchemy";
import { Hyperdrive, Worker } from "alchemy/cloudflare";
import { Database, DatabaseConnection, Project } from "alchemy/prisma";

const app = await alchemy("prisma-postgres-example");

const project = await Project("project");

const database = await Database("database", {
  project,
  region: "us-east-1",
});

const connection = await DatabaseConnection("connection", {
  database,
  name: "connection",
});

const db = await Hyperdrive("prisma-postgres", {
  name: "prisma-postgres",
  origin: `postgres://${connection.user}:${connection.password?.unencrypted}@${connection.host}/${connection.database}`,
});

export const worker = await Worker("worker", {
  entrypoint: "src/worker.ts",
  bindings: {
    HYPERDRIVE: db,
  },
  compatibilityFlags: ["nodejs_compat"],
});

console.log(`worker url: ${worker.url}`);

await app.finalize();
