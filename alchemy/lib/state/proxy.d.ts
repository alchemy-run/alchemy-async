import type { Scope } from "../scope.ts";
import type { State, StateStore } from "../state.ts";
/**
 * Wraps a local or remote state store implementation
 * and handles serialization/deserialization.
 */
export declare abstract class StateStoreProxy implements StateStore {
    readonly scope: Scope;
    private dispatch?;
    constructor(scope: Scope);
    abstract provision(): Promise<StateStoreProxy.Dispatch>;
    private run;
    init(): Promise<void>;
    deinit(): Promise<void>;
    list(): Promise<string[]>;
    count(): Promise<number>;
    get(key: string): Promise<State | undefined>;
    getBatch(ids: string[]): Promise<Record<string, State>>;
    all(): Promise<Record<string, State>>;
    set(key: string, value: State): Promise<void>;
    delete(key: string): Promise<void>;
    private deserialize;
    private serialize;
    private deserializeMany;
}
export declare namespace StateStoreProxy {
    type API = {
        [K in keyof Required<StateStore>]: NonNullable<StateStore[K]> extends (...args: infer Args) => Promise<infer Return> ? {
            method: K;
            params: Args;
            result: Return;
        } : never;
    };
    type Method = keyof API;
    type Dispatch = <TMethod extends Method>(method: TMethod, params: API[TMethod]["params"]) => Promise<API[TMethod]["result"]>;
    type Request<TMethod extends Method, TContext = unknown> = {
        method: TMethod;
        params: API[TMethod]["params"];
        context: TContext;
    };
    type SuccessResponse<TMethod extends Method> = {
        success: true;
        status: number;
        result: API[TMethod]["result"];
    };
    type ErrorResponse = {
        success: false;
        status: number;
        error: string;
    };
    type Response<TMethod extends Method> = SuccessResponse<TMethod> | ErrorResponse;
}
//# sourceMappingURL=proxy.d.ts.map