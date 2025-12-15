import type { CloudflareOptions } from "nitropack/presets/cloudflare/types";
import {
  getDefaultConfigPath,
  getDefaultPersistPath,
  validateConfigPath,
} from "../miniflare/paths.ts";

const alchemy = (
  options: Partial<CloudflareOptions> = {},
): CloudflareOptions => {
  return {
    nodeCompat: true,
    dev: {
      configPath: validateConfigPath(
        options.dev?.configPath ?? getDefaultConfigPath(),
      ),
      persistDir: options.dev?.persistDir ?? getDefaultPersistPath(),
      ...options.dev,
    },
    ...options,
  };
};

export default alchemy;
