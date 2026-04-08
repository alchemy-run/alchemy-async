import path from "pathe";
import cloudflare, { type Options } from "@astrojs/cloudflare";
import type { AstroIntegration } from "astro";
import type { GetPlatformProxyOptions } from "wrangler";
import { getPlatformProxyOptions } from "../cloudflare-env-proxy.ts";

const isAstroCheck =
  !!process.argv.find((arg) => arg.includes("astro")) &&
  process.argv.includes("check");

type AlchemyAstroOptions = Options & {
  platformProxy?: GetPlatformProxyOptions & {
    enabled?: boolean;
  };
};

const alchemy = (options?: AlchemyAstroOptions): AstroIntegration => {
  const { platformProxy: proxyOptions, ...config } = options ?? {};
  const platformProxy = getPlatformProxyOptions(proxyOptions, !isAstroCheck);
  let persistState =
    config.persistState ??
    (platformProxy.persist === false
      ? false
      : {
          path: platformProxy.persist.path,
        });
  if (typeof persistState === "object" && persistState.path.endsWith("v3")) {
    persistState.path = path.dirname(persistState.path);
  }
  const integration = cloudflare({
    ...config,
    configPath: config.configPath ?? platformProxy.configPath,
    persistState,
  } satisfies Options);
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
