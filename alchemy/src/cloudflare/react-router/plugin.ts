import type { PluginConfig } from "@cloudflare/vite-plugin";
import fs from "node:fs/promises";
import path from "pathe";
import { exists } from "../../util/exists.ts";
import { getDefaultConfigPath } from "../miniflare/paths.ts";
import alchemyVite from "../vite/plugin.ts";

const DEFAULT_SSR_MAIN_PATH = "../../workers/app.ts";

const alchemy = async (config: PluginConfig = {}) => {
  if (!config.configPath) {
    config.configPath = getDefaultConfigPath();
    // react-router type generation requries a wrangler.json and creates a chicken and egg problem
    // we create a dummy wrangler.json file so that clean builds can be performed
    if (!(await exists(config.configPath))) {
      await fs.mkdir(path.dirname(config.configPath), { recursive: true });
      await fs.writeFile(
        config.configPath,
        JSON.stringify(
          {
            name: "dummy",
            main: (await exists(
              path.resolve(config.configPath, DEFAULT_SSR_MAIN_PATH),
            ))
              ? undefined
              : DEFAULT_SSR_MAIN_PATH,
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
