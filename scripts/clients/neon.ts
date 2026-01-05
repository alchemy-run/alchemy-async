import type { OpenApi, UserConfig } from "@hey-api/openapi-ts";
import { Node, Project } from "ts-morph";

const spec = await fetch("https://neon.tech/api_spec/release/v2.json").then(
  (res) => res.json() as Promise<OpenApi.V3_0_X>,
);

export default {
  input: spec as any,
  output: {
    indexFile: false,
    path: "alchemy/src/neon/api",
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
        containerName: "NeonClient",
        strategy: "single",
      },
    },
  ],
} satisfies UserConfig;

export const patchNeonResponseTypes = async () => {
  // Neon includes the `GeneralError` type as the default for all operations.
  // Hey API includes it in both the success and error response types, but we only want it in the error response types.
  // So, this removes the `default: GeneralError` property from all `_Responses` type aliases.
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(
    "alchemy/src/neon/api/types.gen.ts",
  );

  // Find all type aliases ending in "Responses"
  const typeAliases = sourceFile.getTypeAliases().filter((typeAlias) => {
    return typeAlias.getName().endsWith("Responses");
  });

  for (const typeAlias of typeAliases) {
    const typeNode = typeAlias.getTypeNode();

    // Check if it's a type literal (object type)
    if (Node.isTypeLiteral(typeNode)) {
      // Find the `default` property signature
      const defaultProperty = typeNode
        .getMembers()
        .find(
          (member) =>
            Node.isPropertySignature(member) && member.getName() === "default",
        );

      if (defaultProperty) {
        // Remove the property (this also removes any leading JSDoc/comments)
        defaultProperty.remove();
      }
    }
  }

  await project.save();
};
