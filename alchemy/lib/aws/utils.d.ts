import type { Provider } from "@smithy/types";
import { AwsClient } from "aws4fetch";
/**
 * Get AWS region from configuration
 */
export declare const getRegion: Provider<string>;
/**
 * AWS Service Configuration
 */
export interface AwsServiceConfig {
    service: string;
    version: string;
    endpoint: (region: string) => string;
}
/**
 * AWS API Caller interface
 */
export interface AwsApiCaller<T = any> {
    createClient(): Promise<AwsClient>;
    callApi<R = T>(client: AwsClient, action: string, params?: Record<string, any>): Promise<R>;
}
/**
 * Create an AWS API caller for a specific service
 */
export declare function getAwsApiCaller<T = any>(config: AwsServiceConfig, responseParser: (xmlText: string) => T): AwsApiCaller<T>;
//# sourceMappingURL=utils.d.ts.map