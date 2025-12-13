/**
 * SecretKey binding for Cloudflare Workers
 *
 * A data class that represents a secret key binding with cryptographic properties.
 * Keys are securely stored and exposed as CryptoKey objects for use with the Web Crypto API.
 *
 * @example
 * // Create an RSA signing key from a JWK format:
 * const keyPair = await crypto.subtle.generateKey(
 *   {
 *     name: "RSA-PSS",
 *     modulusLength: 2048,
 *     publicExponent: new Uint8Array([1, 0, 1]),
 *     hash: "SHA-256",
 *   },
 *   true,
 *   ["sign", "verify"]
 * );
 *
 * const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
 *
 * const signingKey = new SecretKey({
 *   algorithm: { name: "RSA-PSS", hash: "SHA-256" },
 *   format: "jwk",
 *   usages: ["sign"],
 *   key_jwk: secret(privateKeyJwk),
 * });
 *
 * @example
 * // Create an AES encryption key from raw bytes:
 * const aesKey = await crypto.subtle.generateKey(
 *   { name: "AES-GCM", length: 256 },
 *   true,
 *   ["encrypt", "decrypt"]
 * );
 *
 * const keyData = await crypto.subtle.exportKey("raw", aesKey);
 * const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(keyData)));
 *
 * const encryptionKey = new SecretKey({
 *   algorithm: { name: "AES-GCM" },
 *   format: "raw",
 *   usages: ["encrypt", "decrypt"],
 *   key_base64: secret(keyBase64),
 * });
 *
 * @example
 * // Create an ECDSA key from PKCS#8 format:
 * const ecdsaKey = new SecretKey({
 *   algorithm: { name: "ECDSA", namedCurve: "P-256" },
 *   format: "pkcs8",
 *   usages: ["sign"],
 *   key_base64: secret("MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg..."),
 * });
 *
 * @example
 * // Create an HMAC key for message authentication:
 * const hmacKey = await crypto.subtle.generateKey(
 *   { name: "HMAC", hash: "SHA-256" },
 *   true,
 *   ["sign", "verify"]
 * );
 *
 * const keyData = await crypto.subtle.exportKey("raw", hmacKey);
 * const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(keyData)));
 *
 * const macKey = new SecretKey({
 *   algorithm: { name: "HMAC", hash: "SHA-256" },
 *   format: "raw",
 *   usages: ["sign", "verify"],
 *   key_base64: secret(keyBase64),
 * });
 *
 * @see https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/update/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#keyusages
 */
import type { Secret } from "../secret.ts";
/**
 * Data format of the key
 */
export type SecretKeyFormat = "raw" | "pkcs8" | "spki" | "jwk";
/**
 * Allowed operations with the key
 */
export type SecretKeyUsage = "encrypt" | "decrypt" | "sign" | "verify" | "deriveKey" | "deriveBits" | "wrapKey" | "unwrapKey";
/**
 * SecretKey binding properties
 */
export interface SecretKeyProps {
    /**
     * Algorithm-specific key parameters
     */
    algorithm: unknown;
    /**
     * Data format of the key
     */
    format: SecretKeyFormat;
    /**
     * Allowed operations with the key
     */
    usages: SecretKeyUsage[];
    /**
     * Base64-encoded key data. Required if format is "raw", "pkcs8", or "spki"
     */
    key_base64?: Secret;
    /**
     * Key data in JSON Web Key format. Required if format is "jwk"
     */
    key_jwk?: Secret<JsonWebKey>;
}
export declare class SecretKey {
    readonly type = "secret_key";
    readonly algorithm: unknown;
    readonly format: SecretKeyFormat;
    readonly usages: SecretKeyUsage[];
    readonly key_base64?: Secret;
    readonly key_jwk?: Secret<JsonWebKey>;
    constructor(props: SecretKeyProps);
}
//# sourceMappingURL=secret-key.d.ts.map