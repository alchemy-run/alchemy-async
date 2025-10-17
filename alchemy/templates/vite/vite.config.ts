import react from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), alchemy()],
});
