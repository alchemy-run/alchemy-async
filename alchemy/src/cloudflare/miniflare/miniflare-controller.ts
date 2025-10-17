import * as miniflare from "miniflare";
import assert from "node:assert";
import path from "pathe";
import { Scope } from "../../scope.ts";
import { findOpenPort } from "../../util/find-open-port.ts";
import type { HTTPServer } from "../../util/http.ts";
import { logger } from "../../util/logger.ts";
import { AsyncMutex } from "../../util/mutex.ts";
import {
  buildWorkerOptions,
  type MiniflareWorkerInput,
} from "./build-worker-options.ts";
import {
  createMiniflareWorkerProxy,
  type MiniflareWorkerProxy,
} from "./miniflare-worker-proxy.ts";
import { getDefaultPersistPath } from "./paths.ts";
import { createTunnel, type Tunnel } from "./tunnel.ts";

declare global {
  var ALCHEMY_MINIFLARE_CONTROLLER: MiniflareController | undefined;
}

export class MiniflareController {
  abort = new AbortController();
  miniflare: miniflare.Miniflare | undefined;
  options = new Map<string, miniflare.WorkerOptions>();
  tunnel: Tunnel | undefined;
  localProxies = new Map<string, MiniflareWorkerProxy>();
  remoteProxies = new Map<string, HTTPServer>();
  mutex = new AsyncMutex();

  static get singleton() {
    return (globalThis.ALCHEMY_MINIFLARE_CONTROLLER ??=
      new MiniflareController());
  }

  async add(input: MiniflareWorkerInput) {
    const { watch, remoteProxy } = await buildWorkerOptions(input);
    if (remoteProxy) {
      this.remoteProxies.set(input.name, remoteProxy);
    }
    const watcher = watch(this.abort.signal);
    const first = await watcher.next();
    assert(first.value, "First value is undefined");
    this.options.set(input.name, first.value);
    const miniflare = await this.update();
    let url: URL;
    if (input.tunnel) {
      this.tunnel ??= await createTunnel(miniflare);
      url = await this.tunnel.configureWorker({
        api: input.api,
        name: input.name,
      });
    } else {
      const proxy = await createMiniflareWorkerProxy({
        port: input.port ?? (await findOpenPort()),
        getWorkerName: () => input.name,
        miniflare,
        mode: "local",
      });
      this.localProxies.set(input.name, proxy);
      url = proxy.url;
    }
    void this.watch(input.id, watcher);
    logger.task(input.id, {
      message: `Ready at ${url}`,
      status: "success",
      resource: input.id,
      prefix: "dev",
      prefixColor: "cyanBright",
    });
    return url.toString();
  }

  private async watch(
    id: string,
    watcher: AsyncGenerator<miniflare.WorkerOptions>,
  ) {
    for await (const options of watcher) {
      this.options.set(options.name!, options);
      await this.update();
      logger.task(id, {
        message: "Updated",
        status: "success",
        resource: id,
        prefix: "dev",
        prefixColor: "cyanBright",
      });
    }
  }

  private async update() {
    return await this.mutex.lock(async () => {
      const options: miniflare.MiniflareOptions = {
        workers: [],
        defaultPersistRoot: path.resolve(
          getDefaultPersistPath(Scope.current.rootDir),
        ),
        unsafeDevRegistryPath: miniflare.getDefaultDevRegistryPath(),
        log: process.env.DEBUG
          ? new miniflare.Log(miniflare.LogLevel.DEBUG)
          : undefined,
        // This is required to allow websites and other separate processes
        // to detect Alchemy-managed Durable Objects via the Wrangler dev registry.
        unsafeDevRegistryDurableObjectProxy: true,
        // This exposes other handlers like `scheduled` and `email` via HTTP.
        unsafeTriggerHandlers: true,
      };
      for (const worker of this.options.values()) {
        options.workers.push(worker);
        // avoid creating unnecessary directories
        if (worker.analyticsEngineDatasets) {
          options.analyticsEngineDatasetsPersist = true;
        }
        if (worker.d1Databases) {
          options.d1Persist = true;
        }
        if (worker.durableObjects) {
          options.durableObjectsPersist = true;
        }
        if (worker.kvNamespaces) {
          options.kvPersist = true;
        }
        if (worker.r2Buckets) {
          options.r2Persist = true;
        }
        if (worker.secretsStoreSecrets) {
          options.secretsStorePersist = true;
        }
        if (worker.workflows) {
          options.workflowsPersist = true;
        }
      }
      return await this.setMiniflareOptions(options);
    });
  }

  private async setMiniflareOptions(options: miniflare.MiniflareOptions) {
    try {
      if (this.miniflare) {
        await this.miniflare.setOptions(options);
      } else {
        this.miniflare = new miniflare.Miniflare(options);
        await this.miniflare.ready;
      }
      return this.miniflare;
    } catch (error) {
      if (
        error instanceof miniflare.MiniflareCoreError &&
        error.code === "ERR_MODULE_STRING_SCRIPT"
      ) {
        throw new Error(
          'Miniflare detected an external dependency that could not be resolved. This typically occurs when the "nodejs_compat" or "nodejs_als" compatibility flag is not enabled.',
        );
      } else {
        throw error;
      }
    }
  }

  async dispose() {
    this.abort.abort();
    await Promise.all([
      this.miniflare?.dispose(),
      this.tunnel?.close(),
      ...this.localProxies.values().map((proxy) => proxy.close()),
      ...this.remoteProxies.values().map((proxy) => proxy.close()),
    ]);
  }
}
