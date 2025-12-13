import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { State, StateStore } from "../state.ts";
import type { StateStoreProxy } from "./proxy.ts";
import * as schema from "./schema.ts";
type Database = BaseSQLiteDatabase<any, any, typeof schema>;
/**
 * Represents the SQL operations for a SQLite-backed state store.
 * DOES NOT include serialization/deserialization — that is handled by the `StateStoreProxy` class.
 */
export declare class SQLiteStateStoreOperations implements StateStore {
    private readonly db;
    private readonly context;
    constructor(db: Database, context: {
        chain: string[];
    });
    dispatch<TMethod extends StateStoreProxy.Method>(method: TMethod, params: StateStoreProxy.API[TMethod]["params"]): Promise<StateStoreProxy.API[TMethod]["result"]>;
    list(): Promise<string[]>;
    count(): Promise<number>;
    get(key: string): Promise<{
        props: import("../resource.ts").ResourceProps | undefined;
        oldProps: import("../resource.ts").ResourceProps | undefined;
        id: string;
        status: "creating" | "created" | "updating" | "updated" | "deleting" | "deleted";
        kind: string;
        fqn: string;
        seq: number;
        data: Record<string, any>;
        output: import("../resource.ts").Resource<string>;
    } | undefined>;
    all(): Promise<Record<string, State>>;
    set(_key: string, state: State): Promise<void>;
    delete(key: string): Promise<void>;
    getBatch(keys: string[]): Promise<Record<string, State>>;
}
export {};
//# sourceMappingURL=operations.d.ts.map