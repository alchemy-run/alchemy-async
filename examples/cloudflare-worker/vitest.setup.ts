import { MiniflareController } from "alchemy/cloudflare";
import type { TestProject } from "vitest/node";

export async function setup({ provide }: TestProject) {
  const { worker } = await import("./alchemy.run.ts");
  if (!worker.url) {
    throw new Error("worker.url is not defined");
  }
  provide("workerUrl", worker.url);
}

export async function teardown() {
  await MiniflareController.singleton.dispose();
}

declare module "vitest" {
  export interface ProvidedContext {
    workerUrl: string;
  }
}
