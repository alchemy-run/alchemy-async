export interface IdempotentSpawnOptions {
    cmd: string;
    cwd?: string;
    env?: Record<string, string>;
    log: string;
    stateFile?: string;
    overlapBytes?: number;
    resume?: boolean;
    isSameProcess?: (pid: number) => Promise<boolean>;
    processName?: string;
    extract?: (line: string) => string | undefined;
    /**
     * If true, the child's stdout and stderr will not be mirrored to this process's console.
     */
    quiet?: boolean;
}
/**
 * Idempotently ensure a long-lived child is running with stdout/stderr -> files,
 * and mirror those logs to THIS process's console with persisted offsets.
 *
 * Use: await ensureLoggedChildAndMirror({ cmd: "vite dev" })
 */
export declare function idempotentSpawn({ cmd, cwd, env, stateFile, overlapBytes, resume, log, processName, extract, isSameProcess, quiet, }: IdempotentSpawnOptions): Promise<{
    extracted: Promise<string | undefined>;
    stop: () => Promise<void>;
}>;
//# sourceMappingURL=idempotent-spawn.d.ts.map