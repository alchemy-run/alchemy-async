import type { Secret } from "../secret.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
export interface HyperdriveRefProps extends CloudflareApiOptions {
    name?: string;
    id?: string;
    dev?: {
        origin: string | Secret;
    };
}
export type HyperdriveRef = {
    type: "hyperdrive";
    name: string;
    hyperdriveId: string;
    dev?: {
        origin: Secret;
    };
};
export declare function HyperdriveRef(props: HyperdriveRefProps): Promise<HyperdriveRef>;
/**
 * Find a Hyperdrive configuration by name
 */
export declare function findHyperdriveIdByName(api: CloudflareApi, name: string, page?: number): Promise<string | undefined>;
//# sourceMappingURL=hyperdrive-ref.d.ts.map