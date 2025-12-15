import path from "pathe";
import { getPackageManagerRunner } from "../../util/detect-package-manager.ts";
import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { Vite, type ViteProps } from "../vite/vite.ts";
import type { Worker } from "../worker.ts";

export interface ReactRouterProps<B extends Bindings> extends ViteProps<B> {
  /**
   * @default workers/app.ts
   */
  main?: string;
}

// don't allow the ASSETS to be overriden
export type ReactRouter<B extends Bindings> = B extends { ASSETS: any }
  ? never
  : Worker<B & { ASSETS: Assets }>;

export async function ReactRouter<B extends Bindings>(
  id: string,
  props: ReactRouterProps<B> = {},
): Promise<ReactRouter<B>> {
  const runner = await getPackageManagerRunner();
  const cwd = path.resolve(props.cwd ?? process.cwd());
  const ssr = await detectSSREnabled(cwd);
  return await Vite(id, {
    ...props,
    build:
      props.build ??
      `${runner} react-router typegen && ${runner} react-router build`,
    dev:
      props.dev ??
      `${runner} react-router typegen && ${runner} react-router dev`,
    spa: !ssr,
    compatibility: "node",
    entrypoint: props.entrypoint ?? (ssr ? "build/server/index.js" : undefined),
    noBundle: props.noBundle ?? true,
    assets: props.assets ?? "build/client",
    wrangler: {
      main:
        props.wrangler?.main ??
        props.main ??
        (ssr ? "workers/app.ts" : undefined),
      transform: props.wrangler?.transform,
    },
  });
}

/**
 * Detect if SSR is enabled by checking for an `ssr` property in `react-router.config.ts`.
 * If no config is found or if there is no `ssr` property, default to true in line with React Router's default behavior.
 * @see https://reactrouter.com/api/framework-conventions/react-router.config.ts
 */
async function detectSSREnabled(cwd: string): Promise<boolean> {
  const candidates = [
    "react-router.config.ts",
    "react-router.config.mts",
    "react-router.config.mjs",
    "react-router.config.js",
  ];
  const configs = await Promise.allSettled(
    candidates.map((candidate) => import(path.join(cwd, candidate))),
  );
  const config = configs.find((result) => result.status === "fulfilled")?.value;
  return config?.default?.ssr !== false;
}
