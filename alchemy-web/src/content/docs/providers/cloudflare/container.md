---
title: Container
description: Deploy Docker containers on Cloudflare's global network
---

# Container

A Container is a running Docker image running in Cloudflare's global network, managed by a Cloudflare Durable Object.

:::caution
Cloudflare Containers is still in [Beta](https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/).
:::

You'll need:

1. a `Dockerfile` for your Container
2. an `alchemy.run.ts` to deploy to Cloudflare
3. a `MyContainer` class to own a running Container Instance
4. a `worker.ts` that exports `fetch` and routes requests to Container Instances

## Container Class

A Container's lifecycle is managed by a Durable Object class that you define.

We recommend using the `Container` class from `@cloudflare/containers` since it takes care of the basic container lifecycle for you:

```ts
import { Container } from "@cloudflare/containers";
import type { worker } from "../alchemy.run.ts";

export class MyContainer extends Container {
  declare env: typeof worker.Env;

  defaultPort = 8080; // The default port for the container to listen on
  sleepAfter = "3m"; // Sleep the container if no requests are made in this timeframe

  envVars = {
    MESSAGE: "I was passed in via the container class!",
  };

  override onStart() {
    console.log("Container successfully started");
  }

  override onStop() {
    console.log("Container successfully shut down");
  }

  override onError(error: unknown) {
    console.log("Container error:", error);
  }
}
```

## Container Resource

Now, create a `Container` Resource in your `alchemy.run.ts` file and connect it to your `MyContainer` class:

```ts
import { Container, Worker } from "alchemy/cloudflare";
import { Image } from "alchemy/docker";
// import the type of your Container's implementation
import type { MyContainer } from "./src/container.ts";

const container = await Container<MyContainer>("my-container", {
  className: "MyContainer", // <- and ^
});
```

This will build your Dockerfile and prepare it for publishing to Cloudflare's Image Registry.

:::tip
The default behavior is effectively `docker build . -t my-container` but you can customize the configuration:

```ts
const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  name: "your-container",
  tag: "some-tag",
  build: {
    context: import.meta.dir,
    dockerfile: "Dockerfile.dev",
  },
});
```
:::

## Pre-built Images

You can use a pre-built image by passing an image reference to the `image` property:

### Pull an Image by reference

```ts
const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  image: "alpine:latest",
});
```

### Build an Image first

```ts
const image = await Image("my-image", { 
  name: "my-image",
  tag: "latest",
  build: {
    context: path.join(import.meta.dirname, "container"),
  },
});

const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  image,
});
```

### Pull a RemoteImage explcictly

```ts
const remoteImage =  await RemoteImage("alpine", { 
  image: "alpine:latest" 
});

const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  image: remoteImage,
});
```

## Adopting Existing Containers

By default, if a container application with the same name already exists, Alchemy will throw an error. However, you can use the `adopt` property to take over management of an existing container application:

```ts
const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  adopt: true, // Will adopt existing container instead of failing
});
```

## Development Mode

Container resources have special behavior in development mode to support local testing:

### Local Development

By default, when running in dev mode (using `--dev` flag), Container images are **not** pushed to Cloudflare's registry. Instead, they use a local `cloudflare-dev/` prefix that Miniflare can read from your local Docker daemon:

```ts
const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  // In dev mode: uses local Docker image with cloudflare-dev/ prefix
  // In production: pushes to Cloudflare's registry
});
```

### Remote Development

If you need to use a Container with a remote Worker during development, set `dev: { remote: true }` to push the image to Cloudflare:

```ts
const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  dev: {
    remote: true // Forces push to Cloudflare registry even in dev mode
  }
});
```

> [!WARNING]
> **Limitations with Remote Containers**
> - If you set `dev: { remote: true }` on a Container, it cannot be used as a local binding in development
> - Remote container bindings are not supported for locally emulated workers

### Startup Warnings

When calling `container.fetch()` while the container is still starting up, you may see this warning in the console:

```
Error checking if container is ready: connect(): Connection refused: container port not found. Make sure you exposed the port in your container definition.
```

This warning can be safely ignored - the binding still works correctly and this is expected behavior during container startup.

## Rollout Configuration

You can configure rollout strategies for container updates using the `rollout` property. This controls how updates are deployed across instances.

### Immediate Rollout

For immediate updates that apply to all instances at once:

```ts
const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  rollout: {
    strategy: "immediate",
  },
});
```

### Rolling Rollout

For gradual updates that reduce risk by updating instances incrementally:

```ts
const container = await Container<MyContainer>("my-container", {
  className: "MyContainer",
  rollout: {
    strategy: "rolling",
    stepPercentage: 25, // Update 25% of instances at a time
  },
});
```

### Rollout Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `strategy` | `"rolling"` \| `"immediate"` | `"rolling"` | The rollout strategy - "immediate" updates all at once, "rolling" updates gradually |
| `kind` | `"full_auto"` | `"full_auto"` | Automation level - proceeds without manual intervention |
| `stepPercentage` | `number` | `25` | Percentage of instances to update in each step (1-100). Ignored when strategy is "immediate" |

The target configuration (image, instance type, observability) is automatically derived from the container's own configuration - you don't need to specify it manually.

## Bind to Worker

To deploy the `Container` to Cloudflare, you need to bind it to a `Worker`:

```ts
export const worker = await Worker("my-worker", {
  name: "my-worker",
  entrypoint: "./src/worker.ts",
  bindings: {
    MY_CONTAINER: container,
  },
});
```

> [!NOTE]
> Binding a Container to a Worker will also bind a Durable Object Namespace to the Worker.

## Route Requests

To route requests, have your Worker's `fetch` handler resolve a Durable Object instance and proxy the `request` to it:

```ts
import { getContainer } from "@cloudflare/containers";
import type { worker } from "../alchemy.run.ts";

// the class must be exported for Cloudflare
export { MyContainer } from "./container.ts";

export default {
  async fetch(request: Request, env: typeof worker.Env): Promise<Response> {
    const container = getContainer(env.CONTAINER, "container");
    return container.fetch(request);
  },
};
```

> [!TIP]
> Notice how the type of our Worker environment is inferred with `typeof worker.Env`, see the [Type-safe Bindings](/concepts/bindings#type-safe-bindings) documentation for more information.

## Complex Routing

Cloudflare's unique design allows you to implement your own routing strategies in pure JavaScript.

### Round-Robin

For example, you can round-robin requests across a fixed pool by simply generating a random instance ID between 0 and the number of instances:

```ts
export async function loadBalance<T extends Container>(
  binding: DurableObjectNamespace<T>,
  instances = 3
): Promise<DurableObjectStub<T>> {
  const containerId = binding.idFromName(`instance-${rand(0, instances)}`);
  const container = binding.get(containerId);
  return container.fetch(request);
}
```
