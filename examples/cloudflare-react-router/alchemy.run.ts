import alchemy from "alchemy";
import { ReactRouter } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-react-router");

export const website = await ReactRouter("website", {
  name: `${app.name}-${app.stage}-website`,
  bindings: {
    ALCHEMY_TEST_VALUE: alchemy.secret("Hello from Alchemy!"),
  },
});

console.log({
  url: website.url,
});

await app.finalize();
