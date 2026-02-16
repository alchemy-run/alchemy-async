import z from "zod";
import {
  adopt,
  entrypoint,
  eraseSecrets,
  execAlchemy,
  execArgs,
  force,
  watch,
} from "../services/execute-alchemy.ts";
import { loggedProcedure } from "../trpc.ts";

export const deploy = loggedProcedure
  .meta({
    description: "deploy an alchemy project",
  })
  .input(
    z.tuple([
      entrypoint,
      z.object({
        ...execArgs,
        force,
        watch,
        adopt,
        eraseSecrets,
      }),
    ]),
  )
  .mutation(async ({ input }) => execAlchemy(...input));
