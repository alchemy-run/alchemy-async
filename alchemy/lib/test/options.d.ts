import type { DestroyStrategy } from "../destroy.ts";
import type { StateStoreType } from "../state.ts";
/**
 * Options for configuring test behavior
 */
export interface TestOptions {
    /**
     * Whether to suppress logging output.
     * @default false.
     */
    quiet?: boolean;
    /**
     * Apply updates to resources even if there are no changes.
     * @default false
     */
    force?: boolean;
    /**
     * Password to use for test resources.
     * @default "test-password".
     */
    password?: string;
    /**
     * Override the default state store for the test.
     */
    stateStore?: StateStoreType;
    /**
     * Prefix to use for the scope to isolate tests and environments.
     */
    prefix?: string;
    /**
     * The strategy to use when destroying resources.
     *
     * @default "sequential"
     */
    destroyStrategy?: DestroyStrategy;
    /**
     * Whether to run the resources in local mode.
     * @default false
     */
    local?: boolean;
}
//# sourceMappingURL=options.d.ts.map