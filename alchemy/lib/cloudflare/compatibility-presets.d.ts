/**
 * Compatibility presets for Cloudflare Workers
 *
 * These presets provide common sets of compatibility flags to avoid
 * users having to remember which flags they need for common use cases.
 */
/**
 * Mapping of compatibility presets to their respective compatibility flags
 */
export declare const COMPATIBILITY_PRESETS: {
    /**
     * Node.js compatibility preset
     * Enables Node.js APIs and runtime compatibility
     */
    readonly node: readonly ["nodejs_compat", "nodejs_compat_populate_process_env"];
};
export type CompatibilityPreset = keyof typeof COMPATIBILITY_PRESETS;
/**
 * Union preset compatibility flags with user-provided flags
 */
export declare function unionCompatibilityFlags(preset: CompatibilityPreset | undefined, userFlags?: string[]): string[];
//# sourceMappingURL=compatibility-presets.d.ts.map