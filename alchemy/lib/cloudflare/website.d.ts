import { Assets } from "./assets.ts";
import type { Bindings } from "./bindings.ts";
import { type AssetsConfig, Worker, type WorkerProps } from "./worker.ts";
import { type WranglerJsonSpec } from "./wrangler.json.ts";
export interface WebsiteProps<B extends Bindings> extends Omit<WorkerProps<B>, "assets" | "dev"> {
    /**
     * Configuration for the build command
     *
     * If not provided, the build is assumed to have already happened.
     */
    build?: string | {
        /**
         * The command to run to build the site
         */
        command?: string;
        /**
         * Additional environment variables to set when running the build command
         */
        env?: Record<string, string>;
        /**
         * Whether to memoize the command (only re-run if the command changes)
         *
         * When set to `true`, the command will only be re-executed if the command string changes.
         *
         * When set to an object with `patterns`, the command will be re-executed if either:
         * 1. The command string changes, or
         * 2. The contents of any files matching the glob patterns change
         *
         * ⚠️ **Important Note**: When using memoization with build commands, the build outputs
         * will not be produced if the command is memoized. This is because the command is not
         * actually executed when memoized. Consider disabling memoization in CI environments:
         *
         * @example
         * // Disable memoization in CI to ensure build outputs are always produced
         * await Website("my-website", {
         *   command: "vite build",
         *   memoize: process.env.CI ? false : {
         *     patterns: ["./src/**"]
         *   }
         * });
         *
         * @default false
         */
        memoize?: boolean | {
            patterns: string[];
        };
    };
    /**
     * Configuration for the dev command
     */
    dev?: string | {
        /**
         * The command to run to start the dev server
         */
        command?: string;
        /**
         * The local domain to use for the dev server
         */
        domain?: string;
        /**
         * Additional environment variables to set when running the dev command
         */
        env?: Record<string, string>;
    };
    /**
     * The directory containing static assets
     *
     * @default dist
     */
    assets?: string | ({
        directory?: string;
    } & AssetsConfig);
    /**
     * Configures default routing to support client-side routing for Single Page Applications (SPA)
     *
     * @default false
     */
    spa?: boolean;
    /**
     * Configuration for the wrangler.json file
     */
    wrangler?: {
        /**
         * Path to the wrangler.json file
         *
         * @default .alchemy/local/wrangler.jsonc
         */
        path?: string;
        /**
         * The main entry point for the worker
         *
         * @default worker.entrypoint
         */
        main?: string;
        /**
         * Hook to modify the wrangler.json object before it's written
         *
         * This function receives the generated wrangler.json spec and should return
         * a modified version. It's applied as the final transformation before the
         * file is written to disk.
         *
         * @param spec - The generated wrangler.json specification
         * @returns The modified wrangler.json specification
         */
        transform?: (spec: WranglerJsonSpec) => WranglerJsonSpec | Promise<WranglerJsonSpec>;
        /**
         * Whether to include secrets in the wrangler.json file
         *
         * @default true if no path is specified, false otherwise
         */
        secrets?: boolean;
    };
    /**
     * The command to run to build the site.
     * @deprecated Use `build` or `build.command` instead
     */
    command?: string;
    /**
     * Additional environment variables to set when running the build command.
     * @deprecated Use `build.env` instead
     */
    commandEnv?: Record<string, string>;
    /**
     * Whether to memoize the command (only re-run if the command changes)
     * @deprecated Use `build.memoize` instead
     */
    memoize?: boolean | {
        patterns: string[];
    };
}
export type Website<B extends Bindings> = B extends {
    ASSETS: any;
} ? never : Worker<B & {
    ASSETS: Assets;
}>;
export declare function Website<B extends Bindings>(id: string, props: WebsiteProps<B>): Promise<Website<B>>;
export declare const spreadBuildProps: (props: {
    build?: WebsiteProps<Bindings>["build"];
} | undefined, defaultCommand: string) => WebsiteProps<Bindings>["build"];
export declare const spreadDevProps: (props: {
    dev?: WebsiteProps<Bindings>["dev"];
} | undefined, defaultCommand: string) => Exclude<WebsiteProps<Bindings>["dev"], undefined>;
//# sourceMappingURL=website.d.ts.map