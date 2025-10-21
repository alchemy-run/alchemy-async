import alchemy from "alchemy";
import { KVNamespace, Worker } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

const kv = await KVNamespace("kv", {
  title: "kv",
});

export const worker = await Worker("worker", {
  entrypoint: "src/index.ts",
  bindings: {
    KV: kv,
  },
});

console.log(worker.url);

await app.finalize();
