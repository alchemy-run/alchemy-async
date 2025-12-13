import { Secret } from "../secret.ts";
import type { NeonClient } from "./api/sdk.gen.ts";
import type * as neon from "./api/types.gen.ts";
export interface NeonConnectionUri {
    /**
     * Connection URI string
     */
    connection_uri: Secret;
    /**
     * Connection parameters
     */
    connection_parameters: {
        database: string;
        host: string;
        port: number;
        user: string;
        password: Secret;
    };
}
export declare function formatConnectionUri(details: neon.ConnectionDetails): NeonConnectionUri;
export interface NeonRole {
    /**
     * The ID of the branch to which the role belongs
     */
    branch_id: string;
    /**
     * The role name
     */
    name: string;
    /**
     * The role password
     */
    password?: Secret;
    /**
     * Whether or not the role is system-protected
     */
    protected?: boolean;
    /**
     * A timestamp indicating when the role was created
     */
    created_at: string;
    /**
     * A timestamp indicating when the role was last updated
     */
    updated_at: string;
}
export declare function formatRole(role: neon.Role): NeonRole;
export declare function waitForOperations(api: NeonClient, operations: neon.Operation[]): Promise<void>;
//# sourceMappingURL=utils.d.ts.map