interface Encrypted {
    version: "v1";
    ciphertext: string;
    iv: string;
    salt: string;
    tag: string;
}
/**
 * Decrypts a value encrypted with a symmetric key.
 * For backwards compatibility, uses the legacy libsodium implementation if the value is a string.
 * Otherwise, uses the AES-256-GCM implementation with scrypt key derivation.
 */
export declare function decryptWithKey(value: string | Encrypted, key: string): Promise<string>;
/**
 * Encrypt a value with a symmetric key using AES-256-GCM with scrypt key derivation.
 */
export declare function encrypt(value: string, passphrase: string): Promise<Encrypted>;
/**
 * Decrypt a value encrypted with a symmetric key using AES-256-GCM with scrypt key derivation.
 * @internal - Exposed for testing. Use `decryptWithKey` instead.
 */
export declare function aes256Decrypt(parts: Encrypted, passphrase: string): Promise<string>;
/**
 * Encrypt a value with a symmetric key using libsodium
 * @internal - Exposed to test backwards compatibility. Use `encrypt` instead.
 *
 * @param value - The value to encrypt
 * @param key - The encryption key
 * @returns The base64-encoded encrypted value with nonce
 */
export declare function libsodiumEncrypt(value: string, key: string): Promise<string>;
/**
 * Decrypt a value encrypted with a symmetric key using libsodium.
 * @internal - Exposed to test backwards compatibility. Use `decryptWithKey` instead.
 *
 * @param encryptedValue - The base64-encoded encrypted value with nonce
 * @param key - The decryption key
 * @returns The decrypted string
 */
export declare function libsodiumDecrypt(encryptedValue: string, key: string): Promise<string>;
export {};
//# sourceMappingURL=encrypt.d.ts.map