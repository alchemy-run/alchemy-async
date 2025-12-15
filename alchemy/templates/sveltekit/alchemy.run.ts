import alchemy from "alchemy";
import { SvelteKit } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

export const worker = await SvelteKit("website");

console.log({
  url: worker.url,
});

await app.finalize();
