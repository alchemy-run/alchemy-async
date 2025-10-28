import type { PluginConfig } from "@cloudflare/vite-plugin";
import { getDefaultConfigPath } from "../miniflare/paths.ts";
import alchemyVite from "../vite/plugin.ts";

const alchemy = (config: PluginConfig = {}) => {
  if (!config.configPath) {
    config.configPath = getDefaultConfigPath();
  }
  // plugin is not required for react-router typegen, so return a no-op to avoid errors
  if (
    process.argv.some((arg) => arg.includes("react-router")) &&
    process.argv.includes("typegen")
  ) {
    return {
      name: "alchemy-noop",
    };
  }
  return alchemyVite({
    ...config,
    viteEnvironment: {
      name: "ssr",
    },
  });
};

export default alchemy;
