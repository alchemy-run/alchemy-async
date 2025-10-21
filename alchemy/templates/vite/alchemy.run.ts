import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

export const worker = await Vite("website", {
  entrypoint: "src/worker.ts",
});

console.log({
  url: worker.url,
});

await app.finalize();
