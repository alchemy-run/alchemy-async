import path from "node:path";
import { exists } from "../../util/exists.ts";
import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { Vite, type ViteProps } from "../vite/vite.ts";
import type { Worker } from "../worker.ts";

export interface TanStackStartProps<B extends Bindings> extends ViteProps<B> {}

// don't allow the ASSETS to be overriden
export type TanStackStart<B extends Bindings> = B extends { ASSETS: any }
  ? never
  : Worker<B & { ASSETS: Assets }>;

export async function TanStackStart<B extends Bindings>(
  id: string,
  props?: Partial<TanStackStartProps<B>>,
): Promise<TanStackStart<B>> {
  const main =
    props?.wrangler?.main ??
    ((await exists(path.resolve(props?.cwd ?? process.cwd(), "src/server.ts")))
      ? "src/server.ts"
      : undefined);
  return await Vite(id, {
    entrypoint: "dist/server/index.js",
    assets: "dist/client",
    compatibility: "node",
    noBundle: true,
    spa: false,
    ...props,
    wrangler: {
      ...props?.wrangler,
      main,
      transform: async (spec) => {
        const transformed = (await props?.wrangler?.transform?.(spec)) ?? spec;
        if (!main) {
          transformed.main = "@tanstack/react-start/server-entry";
        }
        return transformed;
      },
    },
  });
}
