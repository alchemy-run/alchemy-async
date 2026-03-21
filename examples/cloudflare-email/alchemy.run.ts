import alchemy from "alchemy";
import { SendEmail, Worker } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-email");

export const worker = await Worker("email-worker", {
  entrypoint: "worker.ts",
  compatibility: "node",
  bindings: {
    SEND_EMAIL: SendEmail(),
  },
});

console.log({
  name: worker.name,
  url: worker.url,
});

await app.finalize();
