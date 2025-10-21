import alchemy from "alchemy";
import { D1Database, Worker } from "alchemy/cloudflare";
import { Exec } from "alchemy/os";
import assert from "node:assert";

const app = await alchemy("cloudflare-prisma");

await Exec("prisma-generate", {
  command: "prisma generate",
  memoize: { patterns: ["prisma/schema.prisma"] },
});

const d1 = await D1Database("d1", {
  name: `${app.name}-${app.stage}-d1`,
  adopt: true,
  migrationsDir: "prisma/migrations",
});

export const worker = await Worker("worker", {
  name: `${app.name}-${app.stage}-worker`,
  entrypoint: "src/worker.ts",
  adopt: true,
  bindings: {
    D1: d1,
  },
  compatibilityFlags: ["nodejs_compat"],
});

console.log(`worker.url: ${worker.url}`);

if (process.env.NODE_ENV === "test") {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const res1 = await fetch(worker.url!);
  assert.deepStrictEqual(await res1.json(), []);
  const res2 = await fetch(`${worker.url}/create`);
  assert.deepStrictEqual(await res2.text(), "Created");
  const res3 = await fetch(worker.url!);
  assert.equal(((await res3.json()) as any).length, 1);
  console.log("test passed");
}

await app.finalize();
