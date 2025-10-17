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

### Type Definition Patterns

Alchemy resources follow a specific type definition pattern that ensures type safety and consistency. The key principle is that **the output interface name MUST match the exported resource name** to create a pseudo-class construct:

#### Flat Properties vs Nested Objects

Prefer flat properties over nested configuration objects for better developer experience and type safety:

```ts
// ✅ PREFERRED: Flat properties
export interface MyResourceProps {
  name?: string;
  region: string;
  secret?: string | Secret;
  timeout?: number;
}

// ❌ AVOID: Nested configuration objects
export interface MyResourceProps {
  name?: string;
  config: {
    region: string;
    secret?: string | Secret;
    timeout?: number;
  };
}
```

Flat properties provide:
- Better IDE autocomplete and type checking
- Cleaner resource creation syntax
- Easier validation and error handling
- More intuitive API design

```ts
// ✅ CORRECT: Interface name matches exported resource name
export type Hyperdrive = {
  // ... properties
}
export const Hyperdrive = Resource(/* ... */);

// ❌ INCORRECT: Interface name doesn't match
export interface HyperdriveOutput extends Resource<"cloudflare::Hyperdrive"> {
  // ... properties  
}
export const Hyperdrive = Resource(/* ... */);
```

```ts
// 1. Define Props interface for input parameters
// Note: Extend provider-specific credential interfaces when applicable:
// - Cloudflare: extends CloudflareApiOptions
// - AWS: extends AwsClientProps
// - Other providers: define their own credential patterns

export interface MyResourceProps {
  /**
   * Name of the resource
   * @default ${app}-${stage}-${id}
   */
  name?: string;
  
  /**
   * Property description
   */
  property: string;
  
  /**
   * Secret value for authentication
   * Use alchemy.secret() to securely store this value
   */
  secret?: string | Secret;
  
  /**
   * Whether to adopt an existing resource
   * @default false
   */
  adopt?: boolean;
  
  // Internal properties for lifecycle management
  /** @internal */
  resourceId?: string;
}

// 2. Define output type using Omit pattern
// The Omit pattern removes input-only properties and adds computed/transformed properties
export type MyResource = Omit<MyResourceProps, "adopt"> & {
  /**
   * The ID of the resource
   */
  id: string;
  
  /**
   * Name of the resource (required in output)
   */
  name: string;
  
  /**
   * The provider-generated ID
   */
  resourceId: string;
  
  /**
   * Secret value (always wrapped in Secret for output)
   */
  secret: Secret;
  
  /**
   * Resource type identifier for binding
   * @internal
   */
  type: "my-resource";
};
```

### Resource Implementation Pattern

Resources are implemented using the pseudo-class pattern with proper lifecycle management:

```ts
export const MyResource = Resource(
  "provider::MyResource",
  async function (
    this: Context<MyResource>,
    id: string,
    props: MyResourceProps,
  ): Promise<MyResource> {
    const resourceId = props.resourceId || this.output?.resourceId;
    const adopt = props.adopt || this.scope.adopt;
    const name = props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      // Local development mode - return mock data
      return {
        id,
        name,
        resourceId: resourceId || "",
        property: props.property,
        secret: Secret.wrap(props.secret || ""),
        type: "my-resource",
      };
    }

    const api = await createProviderApi(props);

    if (this.phase === "delete") {
      if (!resourceId) {
        logger.warn(`No resourceId found for ${id}, skipping delete`);
        return this.destroy();
      }

      try {
        const deleteResponse = await api.delete(`/resources/${resourceId}`);
        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          await handleApiError(deleteResponse, "delete", "resource", id);
        }
      } catch (error) {
        logger.error(`Error deleting resource ${id}:`, error);
        throw error;
      }
      return this.destroy();
    }

    // Prepare request body with unwrapped secrets
    const requestBody = {
      name,
      property: props.property,
      secret: Secret.unwrap(props.secret),
    };

    let result: ApiResponse;
    if (resourceId) {
      // Update existing resource
      result = await extractApiResult<ApiResponse>(
        `update resource "${resourceId}"`,
        api.put(`/resources/${resourceId}`, requestBody),
      );
    } else {
      try {
        // Create new resource
        result = await extractApiResult<ApiResponse>(
          `create resource "${name}"`,
          api.post("/resources", requestBody),
        );
      } catch (error) {
        if (error instanceof ApiError && error.code === "ALREADY_EXISTS") {
          if (!adopt) {
            throw new Error(
              `Resource "${name}" already exists. Use adopt: true to adopt it.`,
              { cause: error },
            );
          }
          const existing = await findResourceByName(api, name);
          if (!existing) {
            throw new Error(
              `Resource "${name}" failed to create due to name conflict and could not be found for adoption.`,
              { cause: error },
            );
          }
          result = await extractApiResult<ApiResponse>(
            `adopt resource "${name}"`,
            api.put(`/resources/${existing.id}`, requestBody),
          );
        } else {
          throw error;
        }
      }
    }

    // Construct the output object from API response and props
    return {
      id,
      name: result.name,
      resourceId: result.id,
      property: result.property,
      secret: Secret.wrap(props.secret),
      type: "my-resource",
    };
  },
);
```

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

### Secret Handling

Always use `alchemy.secret()` for sensitive values and properly handle them in the resource lifecycle:

#### Secret Creation Patterns

```ts
// ✅ PREFERRED: alchemy.secret.env.X (better error messages)
const secret = alchemy.secret.env.API_KEY;

// ✅ ACCEPTABLE: alchemy.secret(process.env.X) (more familiar to LLMs)
const secret = alchemy.secret(process.env.API_KEY);

// ❌ AVOID: Plain environment variables without encryption
const secret = process.env.API_KEY;
```

#### Resource Implementation

```ts
// Input props can accept string | Secret
export interface MyResourceProps {
  password: string | Secret;
}

// Output always wraps secrets
export type MyResource = {
  password: Secret;
};

// In implementation, unwrap for API calls, wrap for output
const requestBody = {
  password: Secret.unwrap(props.password),
};

return {
  password: Secret.wrap(props.password),
};
```

### Adoption Pattern

Resources should support adoption of existing resources when conflicts occur:

```ts
// Check for adoption scenarios
if (error instanceof ApiError && error.code === "ALREADY_EXISTS") {
  if (!adopt) {
    throw new Error(
      `Resource "${name}" already exists. Use adopt: true to adopt it.`,
      { cause: error },
    );
  }
  
  // Find and adopt existing resource
  const existing = await findResourceByName(api, name);
  if (!existing) {
    throw new Error(
      `Resource "${name}" failed to create due to name conflict and could not be found for adoption.`,
      { cause: error },
    );
  }
  
  // Update existing resource with new configuration
  result = await extractApiResult<ApiResponse>(
    `adopt resource "${name}"`,
    api.put(`/resources/${existing.id}`, requestBody),
  );
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

### Context and Phase Handling

Alchemy resources use a Context object that provides access to the current lifecycle phase and resource state:

```ts
export const MyResource = Resource(
  "provider::MyResource",
  async function (
    this: Context<MyResource>, // Context provides type-safe access to current state
    id: string,
    props: MyResourceProps,
  ): Promise<MyResource> {
    // Access current phase: "create", "update", or "delete"
    if (this.phase === "delete") {
      // Handle deletion logic
      return this.destroy();
    }
    
    // Access current resource state
    const currentState = this.output;
    
    // Access scope information
    const isLocal = this.scope.local;
    const adopt = props.adopt ?? this.scope.adopt;
    
    // Create physical names using scope
    const name = props.name ?? this.scope.createPhysicalName(id);
    
    // Handle different phases
    if (this.phase === "update" && currentState) {
      // Update existing resource
      // Validate immutable properties
      if (currentState.name !== props.name) {
        throw new Error("Cannot change immutable property 'name'");
      }
    }
    
    // Phase-specific logic
    switch (this.phase) {
      case "create":
        // Handle creation
        break;
      case "update":
        // Handle updates
        break;
      case "delete":
        // Handle deletion
        return this.destroy();
    }
  },
);
```

### Local Development Support

Resources should support local development mode by checking `this.scope.local`:

```ts
if (this.scope.local) {
  // Return mock data for local development
  return {
    id,
    name: props.name || id,
    // ... other mock properties
    type: "my-resource",
  };
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

## Performance Best Practices

### Asynchronous I/O

- **Never use synchronous I/O**: Always use async/await for file operations, network requests, and any I/O operations
- **Blocking the event loop is cancer**: Synchronous operations block the entire event loop and harm application performance

```ts
// ❌ DON'T: Synchronous I/O
const data = fs.readFileSync('file.txt');

// ✅ DO: Asynchronous I/O
const data = await fs.promises.readFile('file.txt');
```

for mapping over arrays, use `Promise.all` instead of a `for` loop:

```ts
// ❌ DON'T: for loop
for (const item of items) {
  await fs.existsSync(item);
}

import { exists } from "../utils/exists.ts";
// ✅ DO: Promise.all
await Promise.all(items.map(
  async (item) => await exists(item)
));
```

## Alchemy.run Patterns

### Application Scoping

Alchemy.run provides application-level scoping with automatic CLI argument parsing:

```ts
// Basic usage with automatic CLI argument parsing
const app = await alchemy("my-app");
// Now supports: --destroy, --read, --quiet, --stage my-stage

// With explicit options (overrides CLI args)
const app = await alchemy("my-app", {
  stage: "prod",
  password: process.env.SECRET_PASSPHRASE // Required for secrets
});

// Create resources within the scope
const resource = await MyResource("my-resource", {
  name: "my-resource",
  apiKey: alchemy.secret.env.API_KEY
});

await app.finalize(); // Always call finalize()
```

### Secret Management

Alchemy provides secure secret handling with encryption:

```ts
// Create encrypted secrets
const secret = alchemy.secret.env.API_KEY;

// Use in resource props
const resource = await MyResource("api", {
  apiKey: secret,
  database: alchemy.secret.env.DB_PASSWORD
});

// Secrets are automatically encrypted in state files
```

### Resource Lifecycle

Resources follow a consistent lifecycle pattern:

```ts
// 1. Resource creation/update
const resource = await MyResource("id", props);

// 2. Access resource properties
console.log(resource.name);
console.log(resource.url);

// 3. Resources are automatically tracked in scope
// 4. Cleanup happens automatically when scope is destroyed
```

### Concurrency and Batching

Alchemy.run handles resource concurrency efficiently:

```ts
// Resources can be created concurrently
const [worker, bucket, database] = await Promise.all([
  Worker("api", { entrypoint: "./src/worker.ts" }),
  R2Bucket("storage", { name: "my-bucket" }),
  D1Database("db", { name: "my-db" })
]);

// Batch operations are optimized automatically
// Keep batches under 50 resources for optimal performance
```

### Error Handling and Retries

Alchemy implements robust error handling:

```ts
// Automatic retry with exponential backoff on failures
// Not on client-side timeouts (reduces compute costs)
const resource = await MyResource("id", props);

// Error handling is built into the resource lifecycle
// Resources handle their own cleanup on failure
```

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
