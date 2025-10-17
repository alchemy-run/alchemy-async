import esbuild from "esbuild";
import { readdir } from "node:fs/promises";
import path from "pathe";
import pkg from "../package.json";

const WORKERS_DIR = path.join(__dirname, "..", "workers");

const workers = await readdir(WORKERS_DIR);

await esbuild.build({
  entryPoints: workers
    .filter((worker) => worker.endsWith(".ts"))
    .map((worker) => path.join(WORKERS_DIR, worker)),
  outdir: WORKERS_DIR,
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  external: ["cloudflare:*", "node:crypto"],
  loader: {
    ".sql": "text",
  },
  define: {
    ALCHEMY_VERSION: JSON.stringify(pkg.version),
  },
});
