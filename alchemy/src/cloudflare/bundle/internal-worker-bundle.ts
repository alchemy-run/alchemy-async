import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "pathe";
import { memoize } from "../../util/memoize.ts";
import type { WorkerBundle } from "../worker-bundle.ts";

export type InternalWorker =
  | "cloudflare-state-store"
  | "dofs-state-store"
  | "remote-binding-proxy"
  | "tunnel-proxy";

export const getInternalWorkerBundle = memoize(async (name: InternalWorker) => {
  const content = await fs.readFile(
    path.join(import.meta.dirname, "..", "..", "..", "workers", `${name}.js`),
    "utf-8",
  );
  return {
    tag: `${name}:${crypto.createHash("sha256").update(content).digest("hex")}`,
    bundle: {
      entrypoint: `${name}.js`,
      modules: [
        {
          type: "esm",
          path: `${name}.js`,
          content: content,
        },
      ],
    } satisfies WorkerBundle,
  };
});
