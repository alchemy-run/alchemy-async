import z from "zod";
import {
  entrypoint,
  execAlchemy,
  execArgs,
} from "../services/execute-alchemy.ts";
import { loggedProcedure, t } from "../trpc.ts";

const tree = loggedProcedure
  .meta({
    description:
      "Print a tree of all stages, scopes, and resources in the configured state store",
  })
  .input(z.tuple([entrypoint, z.object(execArgs)]))
  .mutation(async ({ input: [main, options] }) =>
    execAlchemy(main, {
      ...options,
      stateCmd: "tree",
    }),
  );

const list = loggedProcedure
  .meta({
    description:
      "List the fully-qualified resource names tracked by the configured state store",
  })
  .input(z.tuple([entrypoint, z.object(execArgs)]))
  .mutation(async ({ input: [main, options] }) =>
    execAlchemy(main, {
      ...options,
      stateCmd: "list",
    }),
  );

const get = loggedProcedure
  .meta({
    description: "Print the JSON-encoded state for a single resource",
  })
  .input(
    z.tuple([
      z.string().describe("Fully-qualified resource name (app/stage/.../id)"),
      entrypoint,
      z.object(execArgs),
    ]),
  )
  .mutation(async ({ input: [fqn, main, options] }) =>
    execAlchemy(main, {
      ...options,
      stateCmd: "get",
      stateArg: fqn,
    }),
  );

export const state = t.router({
  tree,
  list,
  get,
});
