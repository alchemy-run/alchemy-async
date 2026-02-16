import cloudflare, { type Options } from "@astrojs/cloudflare";
import type { AstroIntegration } from "astro";
import { getPlatformProxyOptions } from "../cloudflare-env-proxy.ts";

const isAstroCheck =
  !!process.argv.find((arg) => arg.includes("astro")) &&
  process.argv.includes("check");

const alchemy = (options?: Options): AstroIntegration => {
  const integration = cloudflare({
    platformProxy: getPlatformProxyOptions(
      options?.platformProxy,
      !isAstroCheck,
    ),
    ...options,
  });
  const setup = integration.hooks["astro:config:setup"];
  integration.hooks["astro:config:setup"] = async (options) => {
    options.updateConfig({
      vite: {
        server: {
          watch: {
            ignored: ["**/.alchemy/**"],
          },
        },
      },
    });
    await setup?.(options);
  };
  return integration;
};

export default alchemy;
