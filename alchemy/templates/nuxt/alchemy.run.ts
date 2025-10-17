import alchemy from "alchemy";
import { Nuxt } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

export const worker = await Nuxt("website");

console.log({
  url: worker.url,
});

await app.finalize();
