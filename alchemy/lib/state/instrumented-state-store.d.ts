import type { State, StateStore } from "../state.ts";
export declare class InstrumentedStateStore<T extends StateStore> implements StateStore {
    /** @internal */
    __phantom?: T;
    private readonly stateStore;
    private readonly stateStoreClass;
    constructor(stateStore: StateStore);
    private callWithTelemetry;
    init(): Promise<void>;
    deinit(): Promise<void>;
    list(): Promise<string[]>;
    count(): Promise<number>;
    get(key: string): Promise<State<string, import("../resource.ts").ResourceProps | undefined, import("../resource.ts").Resource<string>> | undefined>;
    getBatch(ids: string[]): Promise<Record<string, State<string, import("../resource.ts").ResourceProps | undefined, import("../resource.ts").Resource<string>>>>;
    all(): Promise<Record<string, State<string, import("../resource.ts").ResourceProps | undefined, import("../resource.ts").Resource<string>>>>;
    set(key: string, value: State): Promise<void>;
    delete(key: string): Promise<void>;
}
//# sourceMappingURL=instrumented-state-store.d.ts.map