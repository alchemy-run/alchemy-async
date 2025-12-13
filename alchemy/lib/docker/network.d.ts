import type { Context } from "../context.ts";
/**
 * Properties for creating a Docker network
 */
export interface NetworkProps {
    /**
     * Network name
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Network driver to use
     * @default "bridge"
     */
    driver?: "bridge" | "host" | "none" | "overlay" | "macvlan" | (string & {});
    /**
     * Enable IPv6 on the network
     * @default false
     */
    enableIPv6?: boolean;
    /**
     * Network-scoped alias for containers
     */
    labels?: Record<string, string>;
}
/**
 * Docker Network resource
 */
export interface Network extends NetworkProps {
    /**
     * Network ID
     */
    id: string;
    /**
     * Network name
     */
    name: string;
    /**
     * Time when the network was created
     */
    createdAt: number;
}
/**
 * Create and manage a Docker Network
 *
 * @see https://docs.docker.com/engine/network/
 *
 * @example
 * // Create a simple bridge network
 * const appNetwork = await Network("app-network", {
 *   name: "app-network"
 * });
 *
 * @example
 * // Create a custom network with driver
 * const overlayNetwork = await Network("overlay-network", {
 *   name: "overlay-network",
 *   driver: "overlay",
 *   enableIPv6: true,
 *   labels: {
 *     "com.example.description": "Network for application services"
 *   }
 * });
 */
export declare const Network: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Network>, id: string, props: NetworkProps) => Promise<Network>);
//# sourceMappingURL=network.d.ts.map