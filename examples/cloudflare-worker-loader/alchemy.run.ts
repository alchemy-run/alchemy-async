import alchemy from "alchemy";
import { Worker, WorkerLoader } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-worker-loader");

export const worker = await Worker("worker", {
  entrypoint: "./src/worker.ts",
  bindings: {
    LOADER: WorkerLoader(),
  },
});

console.log(`Worker URL: ${worker.url}`);

await app.finalize();
