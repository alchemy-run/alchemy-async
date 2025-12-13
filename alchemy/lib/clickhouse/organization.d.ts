import type { Secret } from "../secret.ts";
/**
 * Get an organization by name.
 *
 * @example
 * const organization = await OrganizationRef("Alchemy's Organization");
 *
 * @param name The name of the organization to get.
 * @param options The api credentials to use.
 * @returns The organization.
 */
export declare function OrganizationRef(name: string, options?: {
    keyId?: string | Secret<string>;
    secret?: string | Secret<string>;
}): Promise<import("./api/types.gen.ts").Organization>;
//# sourceMappingURL=organization.d.ts.map