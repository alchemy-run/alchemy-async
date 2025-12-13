import type { Secret } from "../secret.ts";
/**
 * Properties for configuring a random string generation
 */
export interface RandomStringProps {
    /**
     * The number of random bytes to generate.
     * The actual string length will depend on the encoding:
     * - hex: length * 2 characters
     * - base64: approximately length * 1.33 characters
     * @default 32
     */
    length?: number;
    /**
     * The encoding format for the random string.
     * - "hex": Hexadecimal encoding (0-9, a-f)
     * - "base64": Base64 encoding (A-Z, a-z, 0-9, +, /)
     * @default "hex"
     */
    encoding?: "hex" | "base64";
}
/**
 * A cryptographically secure random string resource
 */
export interface RandomString {
    /**
     * The generated random string value, stored as a secret
     */
    value: Secret;
    /**
     * The length of the random string
     */
    length: number;
    /**
     * The encoding format of the random string
     */
    encoding: "hex" | "base64";
}
/**
 * Generates a cryptographically secure random string that can be used
 * for API keys, tokens, passwords, or other security-sensitive values.
 * The generated value is automatically wrapped as a secret to prevent
 * accidental exposure in logs or console output.
 *
 * @example
 * // Generate a default random string (32 bytes, hex encoded)
 * const apiKey = await RandomString("api-key");
 * // Result: 64 character hex string (e.g., "a1b2c3d4...")
 *
 * @example
 * // Generate a shorter random string for a verification code
 * const verificationCode = await RandomString("email-verification", {
 *   length: 8,
 *   encoding: "hex"
 * });
 * // Result: 16 character hex string
 *
 * @example
 * // Generate a base64-encoded random string for a session token
 * const sessionToken = await RandomString("session-token", {
 *   length: 48,
 *   encoding: "base64"
 * });
 * // Result: ~64 character base64 string
 *
 * @example
 * // Use with other resources that require secrets
 * const database = await PostgresDatabase("mydb", {
 *   name: "production",
 *   password: (await RandomString("db-password")).value
 * });
 *
 * @example
 * // Generate multiple unique secrets
 * const jwtSecret = await RandomString("jwt-secret", { length: 64 });
 * const encryptionKey = await RandomString("encryption-key", {
 *   length: 32,
 *   encoding: "base64"
 * });
 *
 * @param id - Unique identifier for this random string resource
 * @param props - Configuration options for the random string generation
 * @returns A RandomString resource containing the generated secret value
 */
export declare const RandomString: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: import("../context.ts").Context<any, any>, _id: string, props?: RandomStringProps) => Promise<RandomString>);
//# sourceMappingURL=random-string.d.ts.map