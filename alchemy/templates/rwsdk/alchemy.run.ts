import alchemy from "alchemy";
import {
  D1Database,
  DurableObjectNamespace,
  Redwood,
} from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

const database = await D1Database("database", {
  migrationsDir: "migrations",
});

export const worker = await Redwood("website", {
  bindings: {
    AUTH_SECRET_KEY: alchemy.secret(process.env.AUTH_SECRET_KEY),
    DB: database,
    SESSION_DURABLE_OBJECT: DurableObjectNamespace("session", {
      className: "SessionDurableObject",
    }),
  },
});

console.log({
  url: worker.url,
});

await app.finalize();
