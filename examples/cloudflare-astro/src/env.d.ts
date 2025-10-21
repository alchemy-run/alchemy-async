/// <reference path="../.astro/types.d.ts" />

import type { website } from "../alchemy.run.ts";

type CloudflareEnv = typeof website.Env;

declare namespace App {
  interface Locals extends CloudflareEnv {}
}
