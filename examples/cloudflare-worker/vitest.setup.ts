/// <reference types="vitest" />

import type { TestProject } from "vitest/node";

export async function setup({ provide }: TestProject) {
  const { app, worker } = await import("./alchemy.run.ts");
  if (!worker.url) {
    throw new Error("worker.url is not defined");
  }
  provide("workerUrl", worker.url);
  return () => app.cleanup();
}

declare module "vitest" {
  export interface ProvidedContext {
    workerUrl: string;
  }
}
