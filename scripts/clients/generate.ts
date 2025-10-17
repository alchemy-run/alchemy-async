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
  await patchBiomeConfig();

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
  await $`bunx biome check src/util/api --write`;

  // 3. Remove unused code
  for (const client of clients.slice(1)) {
    await $`rm -rf src/${client}/api/client/ src/${client}/api/core/`;
  }

  await patchNeonResponseTypes();

  // 4. Update imports
  for (const client of clients) {
    await patchClientImports(client);
    await $`bunx biome check src/${client}/api --write`;
  }
};

const patchClientImports = async (client: string) => {
  for (const name of ["client.gen.ts", "sdk.gen.ts"]) {
    const file = Bun.file(`alchemy/src/${client}/api/${name}`);
    const content = await file.text();
    await file.write(content.replace("./client", "../../util/api/client"));
  }
};

const patchBiomeConfig = async () => {
  const root = path.join(import.meta.dirname, "..", "..");
  const file = Bun.file(path.join(root, "biome.json"));
  const json = (await file.json()) as { files: { includes: string[] } };
  const index = json.files.includes.findIndex((value) =>
    value.match(/alchemy\/src\/(.*)\/api\/\*.ts/),
  );
  const value = `alchemy/src/{${clients.join(",")}}/api/*.ts`;
  if (json.files.includes[index] === value) return;
  json.files.includes[index] = value;
  await file.write(`${JSON.stringify(json, null, 2)}\n`);
  await Bun.$.cwd(root)`bunx biome check biome.json --write`;
};

if (import.meta.main) {
  await generate();
}
