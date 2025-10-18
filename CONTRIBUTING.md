# Contributing

## Pre-requisites

1. [Bun](https://bun.sh)

```sh
curl -fsSL https://bun.sh/install | bash
```

## Install

We use bun workspaces, so a simple `bun i` installs all the dependencies:

```sh
bun i
```

## Build

To compile all typescript and bundle the CLI, run:

```sh
bun run build
```

## Check

Type-check and lint (with oxfmt):

```sh
bun check
```

## Test

All tests are in `./alchemy/test/*` or `./alchemy/test/{providerName}/*` and we use Vitest as our test runner.

> [!CAUTION]
> Each provider requires its own credentials, and there are roughly 22 of them. The authoritative list can be found in the [Repository Stack](./stacks/src/repo.run.ts#L80).

When making a change, you can just run the relevant tests instead of setting up every secret.

E.g. to run the Cloudflare tests, you'll need to configure the following environment variables

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_KEY`
- `CLOUDFLARE_EMAIL`

And then run the tests:

```sh
bun vitest run ./alchemy/test/cloudflare
```

Or run a specific test suite:

```sh
bun vitest run ./alchemy/test/cloudflare/worker.test.ts
```

Or run a specific test:

```sh
bun vitest run ./alchemy/test/cloudflare/worker.test.ts -t "create, update, and delete worker (ESM format)"
```

## Writing Providers

Alchemy is a TypeScript-native Infrastructure-as-Code repository where your job is to implement "Resource" providers for various cloud services following strict conventions and patterns.

### Provider Structure

Each provider follows a consistent directory layout:

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
  {provider}-{qualifier?}/ # only add a qualifier if there are more than one example for this {provider}
    package.json
    tsconfig.json
    alchemy.run.ts
    README.md
    src/
      # source code
```

> **Note**: Each Resource has one .ts file, one test suite, and one documentation page.

### Creating a New Resource

#### 1. Define Resource Interfaces

Create your resource file in `alchemy/src/{provider}/{resource}.ts`:

```typescript
import { Context } from "../context.ts";

export interface {Resource}Props {
    // input props with JSDoc comments
}

export interface {Resource} extends Resource<"{provider}::{resource}"> {
    // output props including input props plus additional fields like id, createdAt
}
```

#### 2. Implement the Resource

Use the pseudo-class pattern with proper Context typing:

```typescript
/**
 * {overview}
 *
 * @example
 * ## {Example Title}
 *
 * {concise description}
 *
 * {example snippet}
 */
export const {Resource} = Resource(
  "{provider}::{resource}",
  async function (this: Context<>, id: string, props: {Resource}Props): Promise<{Resource}> {
    if (this.phase === "delete") {
      // Handle deletion
      if (this.output?.id) {
        // Call API to delete resource
        // Log errors but don't throw on 404s
      }
      return this.destroy();
    } else {
      let response;

      if (this.phase === "update" && this.output?.id) {
        // Update existing resource
        response = await api.put(/* update call */);
      } else {
        // Create new resource
        response = await api.post(/* create call */);
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        ...props,
        // other computed properties
      };
    }
  }
);
```

#### 3. Key Resource Implementation Guidelines

- **Validate immutable properties** during updates
- **Use `this.phase`** to determine operation type ("create", "update", "delete")
- **Return `this.destroy()`** for deletion
- **Return `{...}`** for creation/update with all required properties
- **Check response status directly** instead of relying on exceptions
- **Handle 404s gracefully** during deletion

#### 4. Resource Property References

When designing input props, if you have a property that references another entity by ID (e.g., `tableId`, `bucketArn`), instead use:

```typescript
// ✅ Good: Lift the Resource into alchemy abstraction
table: string | Table

// ❌ Avoid: Raw ID references
tableId: string
```

This allows referencing both external entities by name and alchemy resources directly.

### Testing Resources

#### Test Structure

Create comprehensive end-to-end tests in `alchemy/test/{provider}/{resource}.test.ts`:

```typescript
import { describe, expect } from "vitest";
import { destroy } from "../../src/destroy.ts"
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("{Provider}", () => {
  test("{test case}", async (scope) => {
    const resourceId = `${BRANCH_PREFIX}-{id}` // deterministic, unique ID
    let resource: {Resource}
    try {
      // CREATE
      resource = await {Resource}("{id}", {
        // props
      })

      expect(resource).toMatchObject({
        // assertions
      })

      // UPDATE
      resource = await {Resource}("{id}", {
        // updated props
      })

      expect(resource).toMatchObject({
        // updated assertions
      })
    } finally {
      await destroy(scope);
      await assert{Resource}DoesNotExist(resource)
    }
  })
});

async function assert{Resource}DoesNotExist(resource: {Resource}) {
    // Call API to verify resource no longer exists
    // Throw test error if it still exists
}
```

#### Testing Best Practices

1. **Always use try-finally**: Ensure cleanup happens even if assertions fail
2. **Destroy scope in finally**: Call `destroy(scope)` to clean up all resources
3. **Make tests idempotent**: Use deterministic, non-random IDs so failed tests can be re-run
4. **Test create, update, delete**: Cover the full resource lifecycle
5. **Test failed cases**: Include negative test cases for error conditions
6. **Use direct API verification**: Verify changes using the provider's API client
7. **Use BRANCH_PREFIX**: Creates unique test resource names across all tests

#### Test Naming

- Use `BRANCH_PREFIX` for deterministic, non-colliding resource names
- Pattern: `${BRANCH_PREFIX}-test-resource-type`
- Keep names consistent and descriptive

### API Design Principles

When implementing resources that interact with external APIs:

1. **Minimal abstraction**: Use thin wrappers around fetch rather than complex SDK clients
2. **Explicit path construction**: Build API paths explicitly at call sites
3. **Direct HTTP status handling**: Check response status codes directly
4. **Explicit JSON parsing**: Parse JSON responses explicitly where needed
5. **Public properties**: Expose properties like `api.accountId` publicly
6. **Minimal error transformation**: Preserve original error details

### Documentation Requirements

#### Provider README.md

Provide comprehensive documentation of all Resources for the provider with relevant links. This serves as design and internal documentation.

#### Resource Documentation

Each resource requires:
- **Examples**: Multiple @example blocks showing distinct use cases
- **JSDoc comments**: For all properties and interfaces
- **Clear descriptions**: Of what the resource does and when to use it

#### Provider Guide

Create a getting started guide in `./alchemy-web/docs/guides/{provider}.md` that walks users through:
- Installation and setup
- Credential configuration
- Creating their first resource
- Deploying and testing
- Cleanup/teardown

### Before Committing

Always run these commands before committing:

```sh
# Fix code formatting and linting
bun format

# Run tests (targets changed files vs main)
bun run test

# Or run specific tests during development
bun vitest ./alchemy/test/... -t "..."
```
