import type { State, StateStore } from "../state.ts";
import {
  createAndSendEvent,
  type StateStoreTelemetryData,
} from "../util/telemetry.ts";

//todo(michael): we should also handle serde here
export class InstrumentedStateStore<T extends StateStore>
  implements StateStore
{
  /** @internal */
  __phantom?: T;
  private readonly stateStore: StateStore;
  private readonly stateStoreClass: string;

  constructor(stateStore: StateStore) {
    this.stateStore = stateStore;
    this.stateStoreClass = stateStore.constructor.name;
  }

  private async callWithTelemetry<T>(
    event: StateStoreTelemetryData["event"],
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = performance.now();
    let error: unknown;
    try {
      return await fn();
    } catch (err) {
      error = err;
      throw err;
    } finally {
      createAndSendEvent(
        {
          event,
          stateStore: this.stateStoreClass,
          duration: performance.now() - start,
        },
        error instanceof Error
          ? error
          : error
            ? new Error(String(error))
            : undefined,
      );
    }
  }

  async init() {
    if (this.stateStore.init == null) {
      return;
    }
    await this.callWithTelemetry(
      "statestore.init",
      this.stateStore.init.bind(this.stateStore),
    );
  }
  async deinit() {
    if (this.stateStore.deinit == null) {
      return;
    }
    await this.callWithTelemetry(
      "statestore.deinit",
      this.stateStore.deinit.bind(this.stateStore),
    );
  }
  async list() {
    return await this.callWithTelemetry(
      "statestore.list",
      this.stateStore.list.bind(this.stateStore),
    );
  }
  async count() {
    return await this.callWithTelemetry(
      "statestore.count",
      this.stateStore.count.bind(this.stateStore),
    );
  }
  async get(key: string) {
    return await this.callWithTelemetry(
      "statestore.get",
      this.stateStore.get.bind(this.stateStore, key),
    );
  }
  async getBatch(ids: string[]) {
    return await this.callWithTelemetry(
      "statestore.getBatch",
      this.stateStore.getBatch.bind(this.stateStore, ids),
    );
  }
  async all() {
    return await this.callWithTelemetry(
      "statestore.all",
      this.stateStore.all.bind(this.stateStore),
    );
  }
  async set(key: string, value: State) {
    await this.callWithTelemetry(
      "statestore.set",
      this.stateStore.set.bind(this.stateStore, key, value),
    );
  }
  async delete(key: string) {
    await this.callWithTelemetry(
      "statestore.delete",
      this.stateStore.delete.bind(this.stateStore, key),
    );
  }
}
