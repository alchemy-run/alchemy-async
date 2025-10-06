# Alchemy

Alchemy is a Typescript-native Infrastructure-as-Code repository. 
Your job is to implement "Resource" providers for various cloud services by following a set of strict conventions and patterns.

Your job is to build and maintain resource providers following the following convention and structure:

## Provider Layout

```
alchemy/
  src/
    {provider}/
      README.md
      {resource}.ts
  test/
    {provider}/
      {resource}.test.ts
alchemy-web/
  guides/
    {provider}.md # guide on how to get started with the {provider}
  docs/
    providers/
      {provider}/
        index.md # overview of usage and link to all the resources for the provider
        {resource}.md # example-oriented reference docs for the resource
examples/
  {provider}-{qualifier?}/ # only add a qualifier if there are more than one example for this {provider}, e.g. {cloudflare}-{vitejs}
    package.json
    tsconfig.json
    alchemy.run.ts
    README.md #
    src/
      # source code
```

## Convention

> Each Resource has one .ts file, one test suite and one documentation page

## README

Please provide a comprehensive document of all the Resources for this provider with relevant links to documentation. This is effectively the design and internal documentation.

## Resource File

> [!NOTE]
> Follow rules and conventions laid out in the [cursorrules](./.cursorrules).

```ts
// ./alchemy/src/{provider}/{resource}.ts
import { Context } from "../context.ts";

export interface {Resource}Props {
    // input props
}

export interface {Resource} extends Resource<"{provider}::{resource}"> {
    // output props
}

/**
 * {overview}
 *
 * @example
 * ## {Example Title}
 *
 * {concise description}
 *
 * {example snippet}
 *
 * @example
 * // .. repeated for all examples
 */
export const {Resource} = Resource(
  "{provider}::{resource}",
  async function (this: Context<>, id: string, props: {Resource}Props): Promise<{Resource}> {
    // Create, Update, Delete lifecycle
  }
);
```

> [!CAUTION]
> When designing input props, there is the common case of having a property that references another entity in the {provider} domain by Id, e.g. tableId, bucketArn, etc.
>
> In these cases, you should instead opt to represent this as `{resource}: string | {Resource}`, e.g. `table: string | Table`. This "lifts" the Resource into the Alchemy abstraction without sacrificing support for referencing external entities by name.

## Test Suite

> [!NOTE]
> Follow rules and conventions laid out in the [cursorrules](./.cursorrules).

```ts
// ./alchemy/test/{provider}/{resource}.test.ts
import { destroy } from "../src/destroy.ts"
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("{Provider}", () => {
  test("{test case}", async (scope) => {
    const resourceId = `${BRANCH_PREFIX}-{id}` // an ID that is: 1) deterministic (non-random), 2) unique across all tests and all test suites
    let resource: {Resource}
    try {
      // create
      resource = await {Resource}("{id}", {
        // {props}
      })

      expect(resource).toMatchObject({
        // {assertions}
      })

      // update
      resource = await {Resource}("{id}", {
        // {update props}
      })

      expect(resource).toMatchObject({
        // {updated assertions}
      })
    } finally {
      await destroy(scope);
      await assert{ResourceDoesNotExist}(resource)
    }
  })
});

async function assert{Resource}DoesNotExist(api: {Provider}Client, resource: {Resource}) {
    // {call api to check it does not exist, throw test error if it does}
}
```

## Provider Overview Docs (index.md)

Each provider folder should have an `index.md` that indexes and summarizes the provider and links to each resource.

```md
# {Provider}

{overview of the provider}

{official links out to the provider website}

## Resources

- [{Resource}1](./{resource}1.md) - {brief description}
- [{Resource}2](./{resource}2.md) - {brief description}
- ..
- [{Resource}N](./{resource}n.md) - {brief description}

## Example Usage

\`\`\`ts
// {comprehensive end-to-end usage}
\`\`\`
```

## Example Project

An example project is effectively a whole NPM package that demonstrates

```
examples/
  {provider}-{qualifier?}/
    package.json
    tsconfig.json # extends ../../tsconfig.base.json
    alchemy.run.ts
    README.md
    src/
      # code
tsconfig.json # is updated to reference examples/{provider}-{qualifier?}
```

## Guide

Each Provider has a getting started guide in ./alchemy-web/docs/guides/{provider}.md.

```md
---
order: { number to decide the position in the tree view }
title: { Provider }
description: { concise description of the tutorial }
---

# Getting Started {Provider}

{1 sentence overview of what this tutorial will set the user up with}

## Install

{any installation pre-requisites}

::: code-group

\`\`\`sh [bun]
bun ..
\`\`\`

\`\`\`sh [npm]
npm ...
\`\`\`

\`\`\`sh [pnpm]
pnpm ..
\`\`\`

\`\`\`sh [yarn]
yarn ..
\`\`\`

:::

## Credentials

{how to get credentials and store in .env}

## Create a {Provider} application

{code group with commands to run to init a new project}

## Create `alchemy.run.ts`

{one or more subsequent code snippets with explanations for using alchemy to provision this provider}

## Deploy

Run `alchemy.run.ts` script to deploy:

::: code-group

\`\`\`sh [bun]
bun ./alchemy.run
\`\`\`

\`\`\`sh [npm]
npx tsx ./alchemy.run
\`\`\`

\`\`\`sh [pnpm]
pnpm tsx ./alchemy.run
\`\`\`

\`\`\`sh [yarn]
yarn tsx ./alchemy.run
\`\`\`

:::

It should log out the ... {whatever information is relevant for interacting with the app deployed to this provider}
\`\`\`sh
{expected output}
\`\`\`

## Tear Down

That's it! You can now tear down the app (if you want to):

::: code-group

\`\`\`sh [bun]
bun ./alchemy.run --destroy
\`\`\`

\`\`\`sh [npm]
npx tsx ./alchemy.run --destroy
\`\`\`

\`\`\`sh [pnpm]
pnpm tsx ./alchemy.run --destroy
\`\`\`

\`\`\`sh [yarn]
yarn tsx ./alchemy.run --destroy
\`\`\`

:::
```

> [!NOTE]
> You should review all of the existing Cloudflare guides like [cloudflare-vitejs.md](./alchemy-web/docs/guides/cloudflare-vitejs.md) and follow the writing style and flow.

> [!TIP]
> If the Resource is mostly headless infrastructure like a database or some other service, you should use Cloudflare Workers as the runtime to "round off" the example package e.g. for a Neon Provider, we would connect it into a Cloudflare Worker via Hyperdrive and provide a URL (via Worker) to hit that page. Ideally you'd also put ViteJS in front and hit that endpoint.

# Coding Best Practices

> [!IMPORTANT]
> These guidelines have been refined based on code review feedback and production experience. Following them will prevent common issues and improve code quality.

## Resource Implementation

### Runtime Bindings

When adding a new resource type that can be used as a binding:

1. **Always update `bound.ts`**: Add the mapping from your resource type to its runtime binding interface
2. **Follow official API specs**: Use the exact interface specified in the provider's documentation
3. **Don't spread proxy objects**: Proxies can't be spread - explicitly implement each method/property

```ts
// ❌ DON'T: Spread proxy objects
return {
  ...this.runtime,
  someProperty: value,
};

// ✅ DO: Use bind function and explicitly implement methods
const binding = await bind(resource);
return {
  ...resource,
  get: binding.get,
  someProperty: value,
};
```

### Resource Output Properties

Always include relevant metadata in resource outputs:

```ts
export interface MyResource extends Resource<"provider::my-resource"> {
  // Include both human-readable names and system IDs
  resourceName: string;
  resourceId: string;
  // Include any other metadata that callers might need
}
```

### Update Validation

Validate immutable properties during resource updates:

```ts
// Check for changes to immutable properties
if (currentResource.name !== props.name) {
  throw new Error(
    `Cannot change resource name from '${currentResource.name}' to '${props.name}'. Name is immutable after creation.`
  );
}
```

## Testing Guidelines

### Import Strategy

- **Use static imports**: Avoid dynamic imports in test files for better IDE support and error detection

```ts
// ❌ DON'T: Dynamic imports
const { DispatchNamespace } = await import(
  "../../src/cloudflare/dispatch-namespace.ts"
);

// ✅ DO: Static imports
import { DispatchNamespace } from "../../src/cloudflare/dispatch-namespace.ts";
```

### Test Structure

- **Comprehensive end-to-end tests**: Test the full workflow, not just individual components
- **Use testing utilities**: Prefer `fetchAndExpectOK` for durability testing

```ts
test("end-to-end workflow", async (scope) => {
  // 1. Create the infrastructure resource
  const namespace = await DispatchNamespace("test-namespace", { name: "test" });

  // 2. Create a worker that uses the resource
  const worker = await Worker("test-worker", {
    dispatchNamespace: namespace,
    script: "export default { fetch() { return new Response('Hello'); } }",
  });

  // 3. Create a dispatcher that binds to the resource
  const dispatcher = await Worker("dispatcher", {
    bindings: { NAMESPACE: namespace },
    script:
      "export default { async fetch(req, env) { return env.NAMESPACE.get('test-worker').fetch(req); } }",
  });

  // 4. Test end-to-end functionality
  await fetchAndExpectOK(`https://dispatcher.${accountId}.workers.dev`);
});
```

### Type Management

- **Don't export internal types**: Only export types that are part of the public API
- **Follow provider specifications**: Use exact types from official documentation

## Code Organization

### File Structure

- **One concern per file**: Each resource should handle its complete lifecycle in one file
- **Consistent naming**: Use the exact resource name from the provider's API

### Dependencies

- **Minimize cross-resource dependencies**: Resources should be as independent as possible
- **Clear separation of concerns**: Keep API calls, validation, and business logic separate

# Test Workflow

Before committing changes to Git and pushing Pull Requests, make sure to run the following commands to ensure the code is working:

```sh
bun biome check --fix
```

If that fails, consider running (but be careful):

```sh
bun biome check --fix --unsafe
```

Then run tests:

```sh
bun run test
```

> [!TIP] > `bun run test` will diff with `main` and only run the tests that have changed since main. You must be on a branch for this to work.

It is usually better to be targeted with the tests you run instead. That way you can iterate quickly:

```sh
bun vitest ./alchemy/test/.. -t "..."
```

# Pull Request

When submitting a Pull Request with a change, always include a code snippet that shows how the new feature/fix is used. It is not enough to just describe it with text and bullet points.
