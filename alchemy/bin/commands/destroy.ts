import z from "zod";
import {
  entrypoint,
  execAlchemy,
  execArgs,
} from "../services/execute-alchemy.ts";
import { loggedProcedure } from "../trpc.ts";

export const destroy = loggedProcedure
  .meta({
    description: "destroy an alchemy project",
  })
  .input(z.tuple([entrypoint, z.object(execArgs)]))
  .mutation(async ({ input: [main, options] }) =>
    execAlchemy(main, {
      ...options,
      destroy: true,
    }),
  );
