import { cancel, log } from "@clack/prompts";
import pc from "picocolors";
import { trpcServer, type TrpcCliMeta } from "trpc-cli";
import { createAndSendEvent } from "../src/util/telemetry.ts";

export const t = trpcServer.initTRPC.meta<TrpcCliMeta>().create();

export class ExitSignal extends Error {
  constructor(public code = 0) {
    super(`Process exit with code ${code}`);
    this.name = "ExitSignal";
  }
}

export class CancelSignal extends Error {}

const loggingMiddleware = t.middleware(async ({ path, next }) => {
  await createAndSendEvent({
    event: "cli.start",
    command: path,
  });
  let exitCode = 0;

  try {
    await next();
    await createAndSendEvent({
      event: "cli.success",
      command: path,
    });
  } catch (error) {
    const isSafeExit = error instanceof ExitSignal && error.code === 0;
    await createAndSendEvent(
      {
        event: isSafeExit ? "cli.success" : "cli.error",
        command: path,
      },
      isSafeExit ? undefined : error,
    );
    if (error instanceof ExitSignal) {
      exitCode = error.code;
    } else {
      throw error;
    }
  } finally {
    //* this is a node issue https://github.com/nodejs/node/issues/56645
    await new Promise((resolve) => setTimeout(resolve, 100));
    process.exit(exitCode);
  }
});

export const loggedProcedure = t.procedure.use(loggingMiddleware);

// wrap procedure to improve error handling
// TODO(john): use this pattern for other procedures
export const authProcedure = loggedProcedure.use(async (opts) => {
  const result = await opts.next();
  if (result.ok) return result;
  if (result.error.cause instanceof CancelSignal) {
    cancel(pc.red("Operation cancelled."));
    return result;
  }
  if (result.error.cause instanceof ExitSignal) return result;
  log.error(pc.red("An unexpected error occurred."));
  log.error(
    result.error.message
      .split("\n")
      .map((line) => pc.gray(`  ${line}`))
      .join("\n"),
  );
  cancel();
  throw new ExitSignal(1);
});
