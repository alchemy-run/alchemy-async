import { createCloudflareApi, type CloudflareApiOptions } from "./api.ts";
import {
  findVpcServiceByName,
  getService,
  type VpcService,
} from "./vpc-service.ts";

export type VpcServiceRefProps = CloudflareApiOptions &
  (
    | {
        /**
         * The Cloudflare-assigned ID for the VPC service.
         */
        serviceId: string;
      }
    | {
        /**
         * The name of the VPC service.
         */
        name: string;
      }
  );

/**
 * A reference to a VPC service.
 */
export type VpcServiceRef = VpcService;

/**
 * Reference an existing [VPC Service](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/) without managing its lifecycle.
 *
 * @example
 * ```ts
 * // Reference by ID
 * const vpcService = await VpcServiceRef({
 *   serviceId: "123e4567-e89b-12d3-a456-426614174000",
 * });
 * ```
 *
 * @example
 * ```ts
 * // Reference by name
 * const vpcService = await VpcServiceRef({
 *   name: "my-vpc-service",
 * });
 * ```
 */
export async function VpcServiceRef(
  props: VpcServiceRefProps,
): Promise<VpcServiceRef> {
  const api = await createCloudflareApi(props);
  if ("name" in props) {
    const service = await findVpcServiceByName(api, props.name);
    if (!service) {
      throw new Error(`VPC service "${props.name}" not found`);
    }
    return service;
  }
  return await getService(api, props.serviceId);
}
