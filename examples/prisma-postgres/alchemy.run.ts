import alchemy from "alchemy";
import { Hyperdrive, Worker } from "alchemy/cloudflare";
import {
	Database,
	DatabaseConnection,
	Project,
} from "../../alchemy/lib/prisma-postgres";

const app = await alchemy("prisma-postgres-example");

const project = await Project("project");

const database = await Database("database", {
	name: "test",
  project,
  region: "us-east-1",
});
const database2 = await Database("database2", {
	name: "test",
  project,
  region: "us-east-1",
});

const connection = await DatabaseConnection("connection", {
  database,
  name: "connection",
});

const db2 = await Hyperdrive("prisma-postgres", {
  name: "prisma-postgres",
  origin: connection.connectionString.unencrypted,
});

export const worker = await Worker("worker", {
  entrypoint: "src/worker.ts",
  bindings: {
    HYPERDRIVE: db2,
  },
  compatibilityFlags: ["nodejs_compat"],
});

console.log(`worker url: ${worker.url}`);

await app.finalize();