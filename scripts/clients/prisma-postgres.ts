import type {
  OpenApi,
  OpenApiOperationObject,
  UserConfig,
} from "@hey-api/openapi-ts";
import { keys, toCamelCase } from "./utils.ts";

const spec = await fetch("https://api.prisma.io/v1/doc").then(
  (res) => res.json() as Promise<OpenApi.V3_0_X>,
);

const createOperationId = (summary: string) => {
  return toCamelCase(
    summary
      .replace(/(\b(?:a|from|to|the|given|of|an)\b)/gi, "")
      .replace("Get list", "list"),
  );
};

for (const path of keys(spec.paths)) {
  if (!spec.paths[path]) continue;
  for (const method of keys(spec.paths[path])) {
    const operation = spec.paths[path][method] as
      | OpenApiOperationObject.V3_0_X
      | undefined;
    if (!operation || !operation.summary) {
      continue;
    }
    operation.operationId = createOperationId(operation.summary);
  }
}

export default {
  input: spec as any,
  output: {
    indexFile: false,
    path: "alchemy/src/prisma-postgres/api",
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      throwOnError: true,
    },
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      auth: false,
      operations: {
        containerName: "PrismaClient",
        strategy: "single",
      },
    },
  ],
} satisfies UserConfig;
