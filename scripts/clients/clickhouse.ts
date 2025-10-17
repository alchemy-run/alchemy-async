import type {
  OpenApi,
  OpenApiOperationObject,
  UserConfig,
} from "@hey-api/openapi-ts";
import { keys, toCamelCase } from "./utils.ts";

const spec = await fetch("https://api.clickhouse.cloud/v1").then(
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
    path: "alchemy/src/clickhouse/api",
  },
  plugins: [
    {
      name: "@hey-api/typescript",
      exportFromIndex: false,
    },
    {
      name: "@hey-api/sdk",
      instance: "ClickhouseClient",
      exportFromIndex: false,
      auth: false,
    },
    {
      name: "@hey-api/client-fetch",
      throwOnError: true,
    },
  ],
} satisfies UserConfig;
