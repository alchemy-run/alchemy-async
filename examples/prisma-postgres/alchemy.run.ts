import alchemy from "alchemy";
import { Hyperdrive, Worker } from "alchemy/cloudflare";
import { Connection, Database, Project } from "alchemy/prisma-postgres";

const app = await alchemy("prisma-postgres-example");

const project = await Project("project");

const database = await Database("database", {
  project,
  region: "us-east-1",
});

const connection = await Connection("connection", { database });

const db = await Hyperdrive("prisma-postgres", {
  origin: connection.connectionString.unencrypted,
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
