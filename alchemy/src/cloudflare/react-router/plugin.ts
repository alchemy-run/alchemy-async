import type { PluginConfig } from "@cloudflare/vite-plugin";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "pathe";
import { getDefaultConfigPath } from "../miniflare/paths.ts";
import alchemyVite from "../vite/plugin.ts";

const alchemy = (config?: PluginConfig) => {
  const configPath = config?.configPath ?? getDefaultConfigPath();
  // react-router type generation requries a wrangler.json and creates a chicken and egg problem
  // we create a dummy wrangler.json file so that clean builds can be performed
  if (!existsSync(configPath)) {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          name: "dummy",
          compatibility_date: "2025-09-23",
        },
        null,
        2,
      ),
    );
  }
  return alchemyVite({
    ...config,
    viteEnvironment: {
      name: "ssr",
    },
  });
};

export default alchemy;
