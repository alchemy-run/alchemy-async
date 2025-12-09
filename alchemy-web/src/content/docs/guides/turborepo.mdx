---
title: Multiple Apps, Turborepo
description: Use Alchemy to deploy multiple interconnected applications in a single repository.
sidebar:
  order: 0
---

import { FileTree, Steps, Tabs, TabItem } from '@astrojs/starlight/components';

In this guide, we'll walk through how to:
1. Set up a simple monorepo with two applications: a `backend` and a `frontend`
2. Import and bind to the `backend` application from the `frontend` application
3. Deploy, destroy, and dev all applications in the monorepo.

![dev](/turborepo-dev.png)

:::caution
Monorepos only work reliably with Bun, Deno or Node 24+ because it relies on `.ts` export conditions.
:::

<Steps>
1. Set up the `deploy` and `dev` tasks to run in dependency order (`backend → frontend`):

    ```diff lang="json" title="turbo.json"
    {
      "$schema": "https://turborepo.com/schema.json",
      "ui": "tui",
      "tasks": {
    +   "deploy": {
    +     "dependsOn": ["^deploy"],
    +     "cache": false
    +   },
    +   "dev": {
    +     "persistent": true,
    +     "cache": false
    +   },
      }
    }
   ```

   :::caution
   Make sure to set `cache: false` for the `deploy` and `destroy` tasks or else `deploy` and `destroy` will be cached and can't be run multiple times.
   :::

2. Set up the `destroy` task to run in reverse dependency order (`frontend → backend`):

    ```diff lang="json" title="turbo.json"
    {
      "$schema": "https://turborepo.com/schema.json",
      "ui": "tui",
      "tasks": {
        ...
    +    "backend#destroy": {
    +      "dependsOn": ["frontend#destroy"],
    +      "cache": false
    +    },
    +    "frontend#destroy": {
    +      "cache": false
    +    }
      }
    }
    ```

    :::caution
    Without this, the `backend` app will be wrongly destroyed before the downstream `frontend` app and likely fail.
    :::

3. Update the `backend` app to use `import.meta.dirname` to locate the `entrypoint` so that it can be run from any directory (e.g. imported from `apps/frontend`).

    ```diff lang="ts" title="apps/backend/alchemy.run.ts"
    import alchemy from "alchemy";
    import { D1Database, Worker } from "alchemy/cloudflare";
    import path from "node:path";

    const app = await alchemy("backend");
    const db = await D1Database("db");

    export const backend = await Worker("worker", {
    -  entrypoint: path.join("src", "worker.ts"),
    +  entrypoint: path.join(import.meta.dirname, "src", "worker.ts"),
      bindings: {
        db,
        API_KEY: alchemy.secret.env.API_KEY,
      },
    });

    console.log({ url: backend.url });

    await app.finalize();
    ```
   
4. Install `alchemy` and configure `dev`, `deploy` and `destroy` in the `backend` app.

    ```diff lang="json" title="apps/backend/package.json"
    {
      "name": "backend",
      "private": true,
      "type": "module",
      "scripts": {
        "build": "tsc -b",
    +    "dev": "alchemy dev --app backend",
    +    "deploy": "alchemy deploy --app backend",
    +    "destroy": "alchemy destroy --app backend"
      },
      "dependencies": {
    +    "alchemy": "catalog:"
      }
    }
    ```

5. Export `backend/alchemy.run.ts` as `./alchemy`.

    ```diff lang="json" title="apps/backend/package.json"
    "exports": {
      ".": {
        "bun": "./src/index.ts",
        "import": "./lib/src/index.js",
      },
    +  "./alchemy": "./alchemy.run.ts"
    },
    ```

6. Add the `backend` service as a `workspace:*` dependency in the `frontend` app.

    ```diff lang="json" title="apps/frontend/package.json"
    {
      "name": "frontend",
      "private": true,
      "type": "module",
      "dependencies": {
    +    "backend": "workspace:*",
        "alchemy": "catalog:"
      }
    }

7. Import `backend/alchemy` and bind to the exported `backend` Worker:

    ```diff lang="ts" title="apps/frontend/alchemy.run.ts"
    import alchemy from "alchemy";
    import { Vite } from "alchemy/cloudflare";
    +import { backend } from "backend/alchemy";

    const app = await alchemy("frontend");

    export const frontend = await Vite("website", {
    +  bindings: {
    +    backend,
    +  },
    });

    console.log({
      url: frontend.url,
    });

    await app.finalize();
    ```


8. Use `--app frontend` in your frontend's `dev`, `deploy` and `destroy` scripts:

    ```diff lang="json" title="apps/frontend/package.json"
    {
      "name": "frontend",
      "private": true,
      "type": "module",
      "scripts": {
        "build": "tsc -b",
    +    "dev": "alchemy dev --app frontend",
    +    "deploy": "alchemy deploy --app frontend",
    +    "destroy": "alchemy destroy --app frontend"
      },
      "dependencies": {
        "backend": "workspace:*",
        "alchemy": "catalog:"
      }
    }
    ```


    :::tip
    `--app frontend` is required so that the `backend` app runs in [Read Mode](/concepts/phase/#read) documentation for more details.
    :::

9. Run `bun dev` from the root to start the development server for the `frontend` app.

    <Tabs>
    <TabItem label="bun">
    ```sh
    bun dev
    ```
    </TabItem>
    <TabItem label="npm">
    ```sh
    npm run dev
    ```
    </TabItem>
    <TabItem label="yarn">
    ```sh
    yarn dev
    ```
    </TabItem>
    <TabItem label="pnpm">
    ```sh
    pnpm dev
    ```
    </TabItem>
    </Tabs>

    You should see a turborepo TUI with a pane for each app.

    ![dev](/turborepo-dev.png)

10. When ready, run `bun deploy` from the root to deploy the `frontend` app.

    <Tabs>
    <TabItem label="bun">
    ```sh
    bun run deploy
    ```
    </TabItem>
    <TabItem label="npm">
    ```sh
    npm run deploy
    ```
    </TabItem>
    <TabItem label="yarn">
    ```sh
    yarn deploy
    ```
    </TabItem>
    <TabItem label="pnpm">
    ```sh
    pnpm run deploy
    ```
    </TabItem>
    </Tabs>

    ![deploy](/turborepo-deploy.png)
11. (Optional) Tear down both apps:

    <Tabs>
    <TabItem label="bun">
    ```sh
    bun run destroy
    ```
    </TabItem>
    <TabItem label="npm">
    ```sh
    npm run destroy
    ```
    </TabItem>
    <TabItem label="yarn">
    ```sh
    yarn run destroy
    ```
    </TabItem>
    <TabItem label="pnpm">
    ```sh
    pnpm run destroy
    ```
    </TabItem>
    </Tabs>

    ![destroy](/turborepo-destroy.png)
</Steps>



