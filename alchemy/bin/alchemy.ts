import { createCli } from "trpc-cli";
import { configure } from "./commands/configure.ts";
import { create } from "./commands/create.ts";
import { deploy } from "./commands/deploy.ts";
import { destroy } from "./commands/destroy.ts";
import { dev } from "./commands/dev.ts";
import { init } from "./commands/init.ts";
import { login } from "./commands/login.ts";
import { logout } from "./commands/logout.ts";
import { run } from "./commands/run.ts";
import { telemetry } from "./commands/telemetry.ts";
import { util } from "./commands/util.ts";
import { getPackageVersion } from "./services/get-package-version.ts";
import { t } from "./trpc.ts";

const router = t.router({
  create,
  init,
  deploy,
  destroy,
  dev,
  login,
  logout,
  configure,
  run,
  telemetry,
  util,
});

export type AppRouter = typeof router;

const cli = createCli({
  router,
  name: "alchemy",
  version: getPackageVersion(),
  description:
    "🧪 Welcome to Alchemy! Creating infrastructure as code with JavaScript and TypeScript.",
});

cli.run();
