import type { Scope } from "../scope.ts";
import type { State, StateStore } from "../state.ts";
import { withExponentialBackoff } from "../util/retry.ts";

/**
 * Wraps a local or remote state store implementation
 * and handles serialization/deserialization.
 */
export abstract class StateStoreProxy implements StateStore {
  private dispatch?: Promise<StateStoreProxy.Dispatch>;

  constructor(readonly scope: Scope) {}

  abstract provision(): Promise<StateStoreProxy.Dispatch>;

  private async run<TMethod extends StateStoreProxy.Method>(
    method: TMethod,
    params: StateStoreProxy.API[TMethod]["params"],
  ): Promise<StateStoreProxy.API[TMethod]["result"]> {
    this.dispatch ??= this.provision();
    return this.dispatch.then(async (dispatch) => {
      const result = await withExponentialBackoff(
        () => dispatch(method, params),
        () => true,
      );
      return result;
    });
  }

  init(): Promise<void> {
    return this.run("init", []);
  }

  deinit(): Promise<void> {
    return this.run("deinit", []);
  }

  list(): Promise<string[]> {
    return this.run("list", []);
  }

  listScopes(): Promise<string[]> {
    return this.run("listScopes", []);
  }

  count(): Promise<number> {
    return this.run("count", []);
  }

  async get(key: string): Promise<State | undefined> {
    const result = await this.run("get", [key]);
    if (result === undefined) {
      return undefined;
    }
    return await this.deserialize(result);
  }

  async getBatch(ids: string[]): Promise<Record<string, State>> {
    return this.deserializeMany(await this.run("getBatch", [ids]));
  }

  async all(): Promise<Record<string, State>> {
    return this.deserializeMany(await this.run("all", []));
  }

  async set(key: string, value: State): Promise<void> {
    return this.run("set", [key, await this.serialize(value)]);
  }

  async delete(key: string): Promise<void> {
    return this.run("delete", [key]);
  }

  private async deserialize(state: State): Promise<State> {
    const { deserialize } = await import("../serde.ts"); // dynamic import to avoid circular dependency
    return await deserialize(this.scope, state);
  }

  private async serialize(state: State) {
    const { serialize } = await import("../serde.ts");
    return await serialize(this.scope, state);
  }

  private async deserializeMany(states: Record<string, State>) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(states).map(async ([key, value]) => [
          key,
          await this.deserialize(value),
        ]),
      ),
    );
  }
}

export declare namespace StateStoreProxy {
  export type API = {
    [K in keyof Required<StateStore>]: NonNullable<StateStore[K]> extends (
      ...args: infer Args
    ) => Promise<infer Return>
      ? {
          method: K;
          params: Args;
          result: Return;
        }
      : never;
  };
  export type Method = keyof API;

  export type Dispatch = <TMethod extends Method>(
    method: TMethod,
    params: API[TMethod]["params"],
  ) => Promise<API[TMethod]["result"]>;

  export type Request<TMethod extends Method, TContext = unknown> = {
    method: TMethod;
    params: API[TMethod]["params"];
    context: TContext;
  };

  export type SuccessResponse<TMethod extends Method> = {
    success: true;
    status: number;
    result: API[TMethod]["result"];
  };

  export type ErrorResponse = {
    success: false;
    status: number;
    error: string;
  };

  export type Response<TMethod extends Method> =
    | SuccessResponse<TMethod>
    | ErrorResponse;
}
