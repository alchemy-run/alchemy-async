export interface Env {
    [key: string]: string;
    <T = string>(name: string, value?: T | undefined, error?: string): T;
}
export declare const env: Env;
//# sourceMappingURL=env.d.ts.map