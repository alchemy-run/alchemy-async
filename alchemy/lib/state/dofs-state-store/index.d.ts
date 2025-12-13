import { type CloudflareApiOptions } from "../../cloudflare/api.ts";
import type { Scope } from "../../scope.ts";
import type { State, StateStore } from "../../state.ts";
export interface DOFSStateStoreOptions extends CloudflareApiOptions {
    /**
     * The prefix to use for state keys.
     * Each app and stage has its own state store, so this is primarily for testing.
     * @default "alchemy"
     */
    prefix?: string;
    worker?: {
        /**
         * The name of the worker to use
         * @default "alchemy-state"
         */
        name?: string;
        /**
         * The token to use for the worker
         * @default the value of the ALCHEMY_STATE_TOKEN environment variable
         */
        token?: string;
        /**
         * Whether to force the creation of a new worker
         */
        force?: boolean;
    } | {
        /**
         * The URL of an existing state store worker to use
         */
        url: string;
        /**
         * The token to use for the worker
         * @default the value of the ALCHEMY_STATE_TOKEN environment variable
         */
        token?: string;
    };
}
/**
 * A state store backed by a {@link https://www.npmjs.com/package/dofs Durable Object File System (DOFS)}.
 *
 * @deprecated This state store is no longer recommended for production use. Please use {@link https://alchemy.run/guides/cloudflare-state-store/ CloudflareStateStore} from `alchemy/state` instead, which offers better reliability and performance.
 */
export declare class DOFSStateStore implements StateStore {
    private readonly scope;
    private readonly options;
    private prefix;
    private client?;
    constructor(scope: Scope, options?: DOFSStateStoreOptions);
    private createClient;
    private getClient;
    init(): Promise<void>;
    list(): Promise<string[]>;
    count(): Promise<number>;
    get(key: string): Promise<State | undefined>;
    getBatch(ids: string[]): Promise<Record<string, State>>;
    all(): Promise<Record<string, State>>;
    set(key: string, value: State): Promise<void>;
    delete(key: string): Promise<void>;
    private deserializeStates;
    private deserializeState;
    private deserializeKey;
    private serializeKey;
}
//# sourceMappingURL=index.d.ts.map