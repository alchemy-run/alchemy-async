import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("{projectName}");

export const website = await TanStackStart("website");

console.log({
  url: website.url,
});

await app.finalize();
