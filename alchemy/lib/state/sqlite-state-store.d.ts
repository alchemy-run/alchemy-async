import type { Config as LibSQLConfig } from "@libsql/client";
import type { Scope } from "../scope.ts";
import { StateStoreProxy } from "./proxy.ts";
interface BunSQLiteStateStoreOptions {
    /**
     * Use `bun:sqlite` to connect to the SQLite database.
     * Requires Bun.
     */
    engine: "bun";
    /**
     * The filename to use for the SQLite database.
     * @default process.env.ALCHEMY_STATE_FILE if set, otherwise ".alchemy/state.sqlite"
     */
    filename?: string;
    readonly?: boolean;
    create?: boolean;
    readwrite?: boolean;
    safeIntegers?: boolean;
    strict?: boolean;
    dotAlchemy?: string;
}
interface LibSQLStateStoreOptions extends Omit<LibSQLConfig, "url"> {
    /**
     * Use the `@libsql/client` library to connect to the SQLite database.
     * Supported on Node.js and Bun.
     */
    engine: "libsql";
    /**
     * The filename to use for the SQLite database.
     * @default process.env.ALCHEMY_STATE_FILE if set, otherwise ".alchemy/state.sqlite"
     * @note If the `url` option is specified, this option is ignored.
     */
    filename?: string;
    /**
     * The database URL. Overrides the `filename` option.
     *
     * The client supports `libsql:`, `http:`/`https:`, `ws:`/`wss:` and `file:` URL. For more infomation,
     * please refer to the project README:
     *
     * https://github.com/libsql/libsql-client-ts#supported-urls
     */
    url?: string;
    /**
     * The path to the .alchemy directory.
     * @default "./.alchemy"
     */
    dotAlchemy?: string;
}
interface AutoSQLiteStateStoreOptions {
    /**
     * Automatically choose the best SQLite engine based on your environment.
     * @default "auto" - Uses `bun:sqlite` if available, otherwise uses `@libsql/client`.
     */
    engine?: "auto";
    /**
     * The filename to use for the SQLite database.
     * @default ".alchemy/state.sqlite"
     */
    filename?: string;
    /**
     * The path to the .alchemy directory.
     * @default "./.alchemy"
     */
    dotAlchemy?: string;
}
type SQLiteStateStoreOptions = BunSQLiteStateStoreOptions | LibSQLStateStoreOptions | AutoSQLiteStateStoreOptions;
export declare class SQLiteStateStore extends StateStoreProxy {
    private options?;
    constructor(scope: Scope, options?: SQLiteStateStoreOptions | undefined);
    provision(): Promise<StateStoreProxy.Dispatch>;
}
export {};
//# sourceMappingURL=sqlite-state-store.d.ts.map