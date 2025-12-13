import type { Phase } from "../alchemy.ts";
declare global {
    var _ALCHEMY_WARNINGS: Set<string> | undefined;
}
declare const colors: {
    readonly reset: "\u001B[0m";
    readonly cyanBright: "\u001B[96m";
    readonly yellowBright: "\u001B[93m";
    readonly magenta: "\u001B[35m";
    readonly greenBright: "\u001B[92m";
    readonly redBright: "\u001B[91m";
    readonly gray: "\u001B[90m";
};
type ColorName = keyof typeof colors;
export interface Task {
    prefix?: string;
    prefixColor?: ColorName;
    resource?: string;
    message: string;
    status?: "pending" | "success" | "failure";
}
export interface LoggerApi {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    warnOnce: (message: string) => void;
    error: (...args: unknown[]) => void;
    task: (id: string, data: Task) => void;
    exit: () => void;
}
interface AlchemyInfo {
    phase: Phase;
    stage: string;
    appName: string;
}
export declare const createLoggerInstance: (alchemyInfo: AlchemyInfo, customLogger?: LoggerApi) => LoggerApi;
export declare const createDummyLogger: () => LoggerApi;
export declare const createFallbackLogger: (alchemyInfo: AlchemyInfo) => LoggerApi;
export declare const formatFQN: (fqn: string) => string;
export {};
//# sourceMappingURL=cli.d.ts.map