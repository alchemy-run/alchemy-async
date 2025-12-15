import react from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/vite";
import { defineConfig, type PluginOption } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [alchemy() as PluginOption, react()],
});
