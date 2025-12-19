---
title: Durable Object
description: Create, bind, and use Cloudflare Durable Objects in your Worker applications. Learn how to implement stateful microservices with persistent storage in Cloudflare Workers.
sidebar:
  order: 1.1
---

import { Steps } from '@astrojs/starlight/components';

This guide explains how to create, bind and use Cloudflare Durable Objects within your Worker scripts.

:::note
This is a step-by-step guide to deploy a Durable Object, for a complete API reference see the [Durable Object Namespace Provider](/providers/cloudflare/durable-object-namespace).
:::

<Steps>

1. **Create a Durable Object**

   At a bare minimum, you need to create a `DurableObjectNamespace` object as a stable reference to your Durable Object namespace.

   ```ts
   import { DurableObjectNamespace } from "alchemy/cloudflare";

   const counter = DurableObjectNamespace("counter", {
     className: "Counter",
     // whether you want a sqllite db per DO (usually yes!)
     sqlite: true,
   });
   ```

2. **Bind to a Worker**

   Then bind it to your Worker:

   ```ts
   export const worker = await Worker("Worker", {
     name: "my-worker",
     entrypoint: "./index.ts"
     bindings: {
       // bind the Durable Object namespace to your Worker
       COUNTER: counter,
     },
   });
   ```

3. **Implement the Durable Object Class**

   To use this Durable Object, our Worker script must include a class for the Durable Object and then some code in the `fetch` handler to interact with it.

   ```ts
   import type { worker } from "./alchemy.run";
   import { DurableObject } from "cloudflare:workers";

   export class Counter extends DurableObject {
     declare env: typeof worker.Env;
     private count: number;

     constructor(ctx: DurableObjectState, env: typeof worker.Env) {
       super(ctx, env);
       // Initialize count from storage or 0
       this.count = Number(this.ctx.storage.kv.get('count') || 0);
     }

     async fetch(request: Request) {
       const url = new URL(request.url);
       const path = url.pathname;
       
       if (path === "/increment") {
         this.count++;
       } else if (path === "/decrement") {
         this.count--;
       }

       // Update count in storage
       this.ctx.storage.kv.put('count', this.count.toString());
       return Response.json({ count: this.count });
     }
   }
   ```

   :::tip
   See Cloudflare's [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/get-started/) for more details on implementing Durable Objects.
   :::

4. **Call from a Worker**

   Now, our `fetch` handler can get a Durable Object instance via the `COUNTER` binding:

   ```ts
   import { env } from "cloudflare:workers";

   export default {
     async fetch(request: Request) {
       const url = new URL(request.url);

       // Create an ID for the Counter (different IDs = different Counter instances)
       const id = env.COUNTER.idFromName("A");

       // Get a stub for the Counter instance
       const stub = env.COUNTER.get(id);

       // Forward the request to the Durable Object
       return stub.fetch(request);
     },
   };
   ```

5. **(Optional) Rename the Class**

   Alchemy takes care of migrations automatically when you rename the class name. You need to update both the configuration file and the worker file:

   ```diff lang='ts' title="alchemy.run.ts"
    import { DurableObjectNamespace } from "alchemy/cloudflare";

    const counter = DurableObjectNamespace("counter", {
   -  className: "Counter",
   +  className: "MyCounter",
     // whether you want a sqllite db per DO (usually yes!)
     sqlite: true,
    });
   ```

   ```diff lang='ts' title="index.ts"
    import type { worker } from "./alchemy.run";
    import { DurableObject } from "cloudflare:workers";

   -export class Counter extends DurableObject {
   +export class MyCounter extends DurableObject {
      // ... rest of the class
    }
   ```

   :::caution
   You cannot rename the `"counter"` ID in `DurableObjectNamespace("counter")` - we call this the "stable identifier" for the Durable Object and it is immutable for the lifetime of the application.
   :::

</Steps>
