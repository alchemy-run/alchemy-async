import alchemy from "alchemy";
import { ReactRouter } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

export const worker = await ReactRouter("website");

console.log({
  url: worker.url,
});

await app.finalize();
