import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import alchemy from "alchemy/cloudflare/sveltekit";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Using Alchemy adapter for deployment to Cloudflare Workers
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: alchemy(),
  },
};

export default config;
