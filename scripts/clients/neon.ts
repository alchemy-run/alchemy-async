import type { OpenApi, UserConfig } from "@hey-api/openapi-ts";

const spec = await fetch("https://neon.tech/api_spec/release/v2.json").then(
  (res) => res.json() as Promise<OpenApi.V3_0_X>,
);

export default {
  input: spec as any,
  output: {
    path: "alchemy/src/neon/api",
  },
  plugins: [
    {
      name: "@hey-api/typescript",
      exportFromIndex: false,
    },
    {
      name: "@hey-api/sdk",
      instance: "NeonClient",
      exportFromIndex: false,
      auth: false,
    },
    {
      name: "@hey-api/client-fetch",
      throwOnError: true,
    },
  ],
} satisfies UserConfig;

export const patchNeonResponseTypes = async () => {
  // Neon includes the `GeneralError` type as the default for all operations.
  // Hey API includes it in both the success and error response types, but we only want it in the error response types.
  // So, this removes it from the success response types.
  const file = Bun.file("alchemy/src/neon/api/types.gen.ts");
  let text = await file.text();
  const error = `/**
   * General Error.
   *
   * The request may or may not be safe to retry, depending on the HTTP method, response status code,
   * and whether a response was received.
   *
   * - If no response is returned from the API, a network error or timeout likely occurred.
   * - In some cases, the request may have reached the server and been successfully processed, but the response failed to reach the client. As a result, retrying non-idempotent requests can lead to unintended results.
   *
   * The following HTTP methods are considered non-idempotent: \`POST\`, \`PATCH\`, \`DELETE\`, and \`PUT\`. Retrying these methods is generally **not safe**.
   * The following methods are considered idempotent: \`GET\`, \`HEAD\`, and \`OPTIONS\`. Retrying these methods is **safe** in the event of a network error or timeout.
   *
   * Any request that returns a \`503 Service Unavailable\` response is always safe to retry.
   *
   * Any request that returns a \`423 Locked\` response is safe to retry. \`423 Locked\` indicates that the resource is temporarily locked, for example, due to another operation in progress.
   *
   */
  default: GeneralError;`;
  const match = /export type (.+)Responses = {([^}]+)};/g;
  text = text.replaceAll(match, (_, p1, p2) => {
    return `export type ${p1}Responses = {${p2.replace(error, "")}};`;
  });
  await file.write(text);
};
