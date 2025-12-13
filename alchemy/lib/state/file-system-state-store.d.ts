import type { Scope } from "../scope.ts";
import type { State, StateStore } from "../state.ts";
export declare class FileSystemStateStore implements StateStore {
    readonly scope: Scope;
    readonly dir: string;
    private initialized;
    constructor(scope: Scope, options?: {
        rootDir?: string;
    });
    init(): Promise<void>;
    deinit(): Promise<void>;
    count(): Promise<number>;
    list(): Promise<string[]>;
    get(key: string): Promise<State | undefined>;
    set(key: string, value: State): Promise<void>;
    delete(key: string): Promise<void>;
    all(): Promise<Record<string, State>>;
    getBatch(ids: string[]): Promise<Record<string, State>>;
    private getPath;
}
//# sourceMappingURL=file-system-state-store.d.ts.map