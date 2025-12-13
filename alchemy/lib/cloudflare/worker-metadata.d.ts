import type { CloudflareApi } from "./api.ts";
import type { WorkerBindingSpec } from "./bindings.ts";
import type { MultiStepMigration, SingleStepMigration } from "./worker-migration.ts";
import { Worker, type AssetsConfig, type WorkerProps } from "./worker.ts";
/**
 * Metadata returned by Cloudflare API for a worker script
 */
export interface WorkerScriptMetadata {
    /**
     * Worker ID
     */
    id: string;
    /**
     * Default environment information
     */
    default_environment?: WorkerDefaultEnvironment;
    /**
     * Worker creation timestamp
     */
    created_on: string;
    /**
     * Worker last modification timestamp
     */
    modified_on: string;
    /**
     * Worker usage model
     */
    usage_model: string;
    /**
     * Worker environments
     */
    environments?: WorkerEnvironment[];
}
/**
 * Worker script information
 */
export interface WorkerScriptInfo {
    /**
     * Script creation timestamp
     */
    created_on: string;
    /**
     * Script last modification timestamp
     */
    modified_on: string;
    /**
     * Script ID
     */
    id: string;
    /**
     * Script tag
     */
    tag: string;
    /**
     * Script tags
     */
    tags: string[];
    /**
     * Deployment ID
     */
    deployment_id: string;
    /**
     * Tail consumers
     */
    tail_consumers: any;
    /**
     * Whether logpush is enabled
     */
    logpush: boolean;
    /**
     * Observability settings
     */
    observability: {
        /**
         * Whether observability is enabled
         */
        enabled: boolean;
        /**
         * Head sampling rate
         */
        head_sampling_rate: number | null;
    };
    /**
     * Whether the script has assets
     */
    has_assets: boolean;
    /**
     * Whether the script has modules
     */
    has_modules: boolean;
    /**
     * Script etag
     */
    etag: string;
    /**
     * Script handlers
     */
    handlers: string[];
    /**
     * Where the script was last deployed from
     */
    last_deployed_from: string;
    /**
     * Script usage model
     */
    usage_model: string;
}
/**
 * Worker environment information
 */
export interface WorkerEnvironment {
    /**
     * Environment name
     */
    environment: string;
    /**
     * Environment creation timestamp
     */
    created_on: string;
    /**
     * Environment last modification timestamp
     */
    modified_on: string;
}
/**
 * Default environment with script information
 */
export interface WorkerDefaultEnvironment extends WorkerEnvironment {
    /**
     * Script information
     */
    script: WorkerScriptInfo;
}
export interface WorkerMetadata {
    compatibility_date: string;
    compatibility_flags?: string[];
    bindings: WorkerBindingSpec[];
    observability?: {
        enabled?: boolean;
        head_sampling_rate?: number;
        logs?: {
            enabled?: boolean;
            head_sampling_rate?: number;
            invocation_logs?: boolean;
        };
        traces?: {
            enabled?: boolean;
            head_sampling_rate?: number;
            persist?: boolean;
            destinations?: string[];
        };
    };
    logpush?: boolean;
    migrations?: SingleStepMigration;
    main_module?: string;
    body_part?: string;
    tags?: string[];
    assets?: {
        jwt?: string;
        keep_assets?: boolean;
        config?: AssetsConfig;
    };
    cron_triggers?: {
        cron: string;
        suspended: boolean;
    }[];
    containers?: {
        class_name: string;
    }[];
    placement?: {
        mode: "smart";
    };
    limits?: {
        cpu_ms?: number;
    };
    tail_consumers?: Array<Worker | {
        service: string;
    }>;
}
export declare function prepareWorkerMetadata(api: CloudflareApi, props: Omit<WorkerProps, "entrypoint"> & {
    compatibilityDate: string;
    compatibilityFlags: string[];
    workerName: string;
    migrationTag?: string;
    assetUploadResult?: {
        completionToken?: string;
        keepAssets?: boolean;
        assetConfig?: AssetsConfig;
    };
    tags?: string[];
    unstable_cacheWorkerSettings?: boolean;
    placement?: {
        mode: "smart";
    };
}): Promise<WorkerMetadata>;
export declare function bumpMigrationTagVersion(tag?: string): string | undefined;
interface WorkerSettings {
    bindings: WorkerBindingSpec[];
    compatibility_date: string;
    compatibility_flags: string[];
    migrations: SingleStepMigration | MultiStepMigration;
    tags: string[];
    [key: string]: any;
}
export declare function getWorkerSettings(api: CloudflareApi, workerName: string): Promise<WorkerSettings | undefined>;
export {};
//# sourceMappingURL=worker-metadata.d.ts.map