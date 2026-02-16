import adapter, { type AdapterOptions } from "@sveltejs/adapter-cloudflare";
import type { Adapter } from "@sveltejs/kit";
import { getPlatformProxyOptions } from "../cloudflare-env-proxy.ts";
import { withSkipPathValidation } from "../miniflare/paths.ts";

const isSvelteLanguageServer = !!process.argv.find((arg) =>
  arg.includes("svelte-language-server"),
);

export default (options?: AdapterOptions): Adapter => {
  if (isSvelteLanguageServer) {
    // the svelte language server runs from the root and therefore may be running in a different cwd than the `Website.cwd`
    // for now, we work around this by returning a noop adapter to avoid breaking svelte intellisense
    return {
      adapt() {},
      name: "alchemy-noop",
    };
  }
  const { platformProxy: proxyOptions, ...config } = options ?? {};
  const hasCustomConfigPath =
    typeof proxyOptions === "object" &&
    proxyOptions !== null &&
    typeof proxyOptions.configPath === "string";

  const platformProxy = hasCustomConfigPath
    ? getPlatformProxyOptions(proxyOptions)
    : withSkipPathValidation(() => getPlatformProxyOptions(proxyOptions));

  return adapter({
    platformProxy,
    config: platformProxy.configPath,
    ...config,
  });
};
