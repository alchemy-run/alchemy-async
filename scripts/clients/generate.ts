import {
  createClient,
  defineConfig,
  type UserConfig,
} from "@hey-api/openapi-ts";
import path from "pathe";
import { patchNeonResponseTypes } from "./neon.ts";

export const clients = [
  "neon",
  "planetscale",
  "clickhouse",
  "prisma-postgres",
] as const;

export const generate = async () => {
  // 1. Generate clients
  for (const client of clients) {
    const input = (await import(`./${client}.ts`)) as {
      default: UserConfig;
    };
    const config = await defineConfig(input.default);
    await createClient(config);
  }

  // 2. Move shared code to util/api
  const $ = Bun.$.cwd(path.join(process.cwd(), "alchemy"));
  await $`rm -rf src/util/api`;
  await $`mkdir -p src/util/api`;
  await $`mv src/${clients[0]}/api/client/ src/${clients[0]}/api/core/ src/util/api/`;
  await $`bunx oxlint src/util/api`;

  // 3. Remove unused code
  for (const client of clients.slice(1)) {
    await $`rm -rf src/${client}/api/client/ src/${client}/api/core/`;
  }

  await patchNeonResponseTypes();

  // 4. Update imports
  for (const client of clients) {
    await patchClientImports(client);
    await $`bunx oxlint src/${client}/api`;
  }
};

const patchClientImports = async (client: string) => {
  for (const name of ["client.gen.ts", "sdk.gen.ts"]) {
    const file = Bun.file(`alchemy/src/${client}/api/${name}`);
    const content = await file.text();
    await file.write(content.replace("./client", "../../util/api/client"));
  }
};

if (import.meta.main) {
  await generate();
}
