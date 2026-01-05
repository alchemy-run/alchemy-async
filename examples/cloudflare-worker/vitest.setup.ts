import type { TestProject } from "vitest/node";

export async function setup({ provide }: TestProject) {
  const { worker } = await import("./alchemy.run.ts");
  if (!worker.url) {
    throw new Error("worker.url is not defined");
  }
  provide("workerUrl", worker.url);
}

declare module "vitest" {
  export interface ProvidedContext {
    workerUrl: string;
  }
}
