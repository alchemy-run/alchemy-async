/**
 * Cloudflare API response format
 */
export interface CloudflareResponse<T = unknown> {
    result: T;
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
    }>;
    messages: string[];
}
//# sourceMappingURL=response.d.ts.map