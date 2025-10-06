import * as prompts from "@clack/prompts";
import pc from "picocolors";
import {
  setGlobalTelemetryDisabled,
  setGlobalTelemetryEnabled,
} from "../../src/util/telemetry.ts";
import { t } from "../trpc.ts";

export const telemetry = t.router({
  disable: t.procedure
    .meta({
      description: "disable telemetry",
    })
    .mutation(async () => {
      prompts.intro(pc.cyan("🧪 Telemetry"));
      await setGlobalTelemetryDisabled();
      prompts.outro(
        `Telemetry disabled. ${pc.dim(`To re-enable, run ${pc.bold("alchemy telemetry enable")}`)}`,
      );
    }),

  enable: t.procedure
    .meta({
      description: "enable telemetry",
    })
    .mutation(async () => {
      prompts.intro(pc.cyan("🧪 Telemetry"));
      await setGlobalTelemetryEnabled();
      prompts.outro(
        `Telemetry enabled. ${pc.dim(`To disable, run ${pc.bold("alchemy telemetry disable")}`)}`,
      );
    }),
});
