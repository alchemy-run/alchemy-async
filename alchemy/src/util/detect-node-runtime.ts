declare var Deno: any;
declare var Bun: any;

export type Runtime = "bun" | "deno" | "node";

export function detectRuntime(): Runtime {
  if (typeof Bun !== "undefined" && Bun !== null) return "bun";
  if (typeof Deno !== "undefined" && Deno !== null) return "deno";
  return "node";
}
