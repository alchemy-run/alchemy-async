import { AwsClient } from "aws4fetch";
import type { AwsClientProps } from "../client-props.ts";
import { getRegion } from "../utils.ts";
/**
 * Shared EC2 utilities for all EC2 resources
 */
/**
 * Create an AWS EC2 client with credential resolution from props
 *
 * This function handles the complete credential resolution process internally,
 * merging global, scope, and resource-level credentials according to the
 * established precedence hierarchy.
 *
 * @param props - AWS client properties that may include credential overrides
 * @returns Promise<AwsClient> - Configured AWS client for EC2 operations
 */
export declare function createEC2Client(props?: AwsClientProps): Promise<AwsClient>;
/**
 * Make an EC2 API call with custom response parser
 */
export declare function callEC2Api<T>(client: AwsClient, action: string, responseParser: (xmlText: string) => T, params?: Record<string, any>): Promise<T>;
export { getRegion };
//# sourceMappingURL=utils.d.ts.map