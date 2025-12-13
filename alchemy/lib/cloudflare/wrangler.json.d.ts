import type { Unstable_Config as WranglerJsonConfig } from "wrangler";
import { Worker, type WorkerProps } from "./worker.ts";
/**
 * Properties for wrangler.json configuration file
 */
export interface WranglerJsonProps {
    name?: string;
    /**
     * The worker to generate the wrangler.json file for
     */
    worker: Worker<any> | (WorkerProps<any> & {
        name: string;
    });
    /**
     * Path to write the wrangler.json file to
     *
     * @default worker.cwd/wrangler.json
     */
    path?: string;
    /**
     * The main entry point for the worker
     *
     * @default worker.entrypoint
     */
    main?: string;
    /**
     * Path to the assets directory
     *
     * @default inferred from the worker's Asset bindings
     */
    assets?: {
        binding: string;
        directory: string;
    };
    /**
     * Whether to include secrets in the wrangler.json file
     *
     * @default true
     */
    secrets?: boolean;
    /**
     * Transform hooks to modify generated configuration files
     */
    transform?: {
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
        wrangler?: (spec: WranglerJsonSpec) => WranglerJsonSpec | Promise<WranglerJsonSpec>;
    };
}
/**
 * Output returned after WranglerJson creation/update
 */
export interface WranglerJson extends WranglerJsonProps {
    /**
     * Time at which the file was created
     */
    createdAt: number;
    /**
     * Time at which the file was last updated
     */
    updatedAt: number;
    /**
     * Path to the wrangler.json file
     */
    path: string;
    /**
     * `wrangler.json` spec
     */
    spec: WranglerJsonSpec;
}
/**
 * Resource for managing wrangler.json configuration files
 */
export declare function WranglerJson(props: WranglerJsonProps): Promise<WranglerJson>;
/**
 * Wrangler.json configuration specification based on Cloudflare's schema
 */
export interface WranglerJsonSpec extends Partial<WranglerJsonConfig> {
}
//# sourceMappingURL=wrangler.json.d.ts.map