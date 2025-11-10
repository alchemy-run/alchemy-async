import cloudflare, { type Options } from "@astrojs/cloudflare";
import type { AstroIntegration } from "astro";
import { getPlatformProxyOptions } from "../cloudflare-env-proxy.ts";

const isAstroCheck =
  !!process.argv.find((arg) => arg.includes("astro")) &&
  process.argv.includes("check");

const alchemy = (options?: Options): AstroIntegration => {
  return cloudflare({
    platformProxy: getPlatformProxyOptions(
      options?.platformProxy,
      !isAstroCheck,
    ),
    ...options,
  });
};

export default alchemy;
