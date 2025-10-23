import type { PluginConfig } from "@cloudflare/vite-plugin";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "pathe";
import { getDefaultConfigPath } from "../miniflare/paths.ts";
import alchemyVite from "../vite/plugin.ts";

const alchemy = (config: PluginConfig = {}) => {
  if (!config.configPath) {
    config.configPath = getDefaultConfigPath();
    // react-router type generation requries a wrangler.json and creates a chicken and egg problem
    // we create a dummy wrangler.json file so that clean builds can be performed
    if (!existsSync(config.configPath)) {
      mkdirSync(dirname(config.configPath), { recursive: true });
      writeFileSync(
        config.configPath,
        JSON.stringify(
          {
            name: "dummy",
            main: "../../workers/app.ts",
            compatibility_date: "2025-10-23",
            compatibility_flags: ["nodejs_compat"],
          },
          null,
          2,
        ),
      );
    }
  }
  return alchemyVite({
    ...config,
    viteEnvironment: {
      name: "ssr",
    },
  });
};

export default alchemy;
