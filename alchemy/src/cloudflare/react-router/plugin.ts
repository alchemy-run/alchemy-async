import type { PluginConfig } from "@cloudflare/vite-plugin";
import alchemyVite from "../vite/plugin.ts";

const alchemy = (config: PluginConfig = {}) => {
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
    viteEnvironment: {
      name: "ssr",
    },
    ...config,
  });
};

export default alchemy;
