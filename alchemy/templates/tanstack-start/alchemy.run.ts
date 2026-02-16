import alchemy from "alchemy";
import { R2Bucket, TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

const r2 = await R2Bucket("r2");

export const website = await TanStackStart("website", {
  bindings: {
    R2: r2,
  },
});

console.log({
  url: website.url,
});

await app.finalize();
