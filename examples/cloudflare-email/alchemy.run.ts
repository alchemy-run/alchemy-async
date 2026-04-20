import alchemy from "alchemy";
import { EmailSender, Worker } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-email");

export const worker = await Worker("email-worker", {
  entrypoint: "./worker.ts",
  compatibility: "node",
  bindings: {
    EMAIL: EmailSender({
      allowedSenderAddresses: ["noreply@example.com"],
      dev: { remote: true },
    }),
  },
});

console.log({
  name: worker.name,
  url: worker.url,
});

await app.finalize();
