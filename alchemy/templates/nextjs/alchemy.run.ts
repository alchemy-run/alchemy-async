import alchemy from "alchemy";
import { Nextjs } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

export const worker = await Nextjs("website", {
  name: `${app.name}-${app.stage}-website`,
});

console.log({
  url: worker.url,
});

await app.finalize();