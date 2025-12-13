import type { Phase } from "../alchemy.ts";
export declare const TELEMETRY_DISABLED: boolean;
export declare const TELEMETRY_API_URL: string;
export declare const SUPPRESS_TELEMETRY_ERRORS: boolean;
export declare const getGlobalTelemetryDisabled: () => Promise<boolean>;
export declare function setGlobalTelemetryDisabled(): Promise<void>;
export declare function setGlobalTelemetryEnabled(): Promise<void>;
export declare const collectData: () => Promise<GenericTelemetryData>;
export type GenericTelemetryData = {
    userId: string;
    sessionId: string;
    referrer: string;
    platform: string;
    osVersion: string;
    arch: string;
    cpus: number;
    memory: number;
    rootCommitHash: string;
    gitOriginUrl: string;
    gitBranchHash: string;
    runtime: string;
    runtimeVersion: string;
    ciProvider: string;
    isCI: boolean;
    alchemyVersion: string;
};
export type ErrorData = {
    errorTag: string;
    errorMessage: string;
    errorStack: string;
};
export type CliTelemetryData = {
    command: string;
    event: "cli.start" | "cli.success" | "cli.error";
};
export type ResourceTelemetryData = {
    phase: Phase;
    event: "resource.start" | "resource.success" | "resource.error" | "resource.skip" | "resource.read";
    resource: string;
    status: "creating" | "created" | "updating" | "updated" | "deleting" | "deleted" | "unknown";
    duration: number;
    replaced: boolean;
};
export type StateStoreTelemetryData = {
    event: "statestore.init" | "statestore.deinit" | "statestore.list" | "statestore.count" | "statestore.get" | "statestore.getBatch" | "statestore.all" | "statestore.set" | "statestore.delete";
    stateStore: string;
    duration: number;
};
export type AlchemyTelemetryData = {
    event: "alchemy.start" | "alchemy.success" | "alchemy.error";
    duration: number;
};
export declare function createAndSendEvent(data: CliTelemetryData | ResourceTelemetryData | StateStoreTelemetryData | AlchemyTelemetryData, error?: Error): Promise<void>;
//# sourceMappingURL=telemetry.d.ts.map