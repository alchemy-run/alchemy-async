import crypto from "node:crypto";

const KEY_LEN = 32;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SALT_LEN = 16;
const IV_LEN = 12;
const ALGO = "aes-256-gcm";

interface Encrypted {
  version: "v1";
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
  tag: string; // base64
}

/**
 * Decrypts a value encrypted with a symmetric key.
 * For backwards compatibility, uses the legacy libsodium implementation if the value is a string.
 * Otherwise, uses the AES-256-GCM implementation with scrypt key derivation.
 */
export function decryptWithKey(
  value: string | Encrypted,
  key: string,
): Promise<string> {
  if (typeof value === "string") {
    return libsodiumDecrypt(value, key);
  }
  return aes256Decrypt(value, key);
}

/**
 * Encrypt a value with a symmetric key using AES-256-GCM with scrypt key derivation.
 */
export async function encrypt(
  value: string,
  passphrase: string,
): Promise<Encrypted> {
  const salt = crypto.randomBytes(SALT_LEN);
  const key = await deriveScryptKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LEN);

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    version: "v1",
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypt a value encrypted with a symmetric key using AES-256-GCM with scrypt key derivation.
 * @internal - Exposed for testing. Use `decryptWithKey` instead.
 */
export async function aes256Decrypt(
  parts: Encrypted,
  passphrase: string,
): Promise<string> {
  const salt = Buffer.from(parts.salt, "base64");
  const iv = Buffer.from(parts.iv, "base64");
  const ciphertext = Buffer.from(parts.ciphertext, "base64");
  const tag = Buffer.from(parts.tag, "base64");

  const key = await deriveScryptKey(passphrase, salt);

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

async function deriveScryptKey(
  passphrase: string,
  salt: Buffer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      passphrase,
      salt,
      KEY_LEN,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
      },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      },
    );
  });
}

/**
 * Encrypt a value with a symmetric key using libsodium
 * @internal - Exposed to test backwards compatibility. Use `encrypt` instead.
 *
 * @param value - The value to encrypt
 * @param key - The encryption key
 * @returns The base64-encoded encrypted value with nonce
 */
export async function libsodiumEncrypt(
  value: string,
  key: string,
): Promise<string> {
  const sodium = (await import("libsodium-wrappers")).default;
  // Initialize libsodium
  await sodium.ready;

  // Derive a key from the passphrase
  const cryptoKey = sodium.crypto_generichash(
    sodium.crypto_secretbox_KEYBYTES,
    sodium.from_string(key),
  );

  // Generate a random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  // Encrypt the message
  const encryptedBin = sodium.crypto_secretbox_easy(
    sodium.from_string(value),
    nonce,
    cryptoKey,
  );

  // Combine nonce and ciphertext, then encode to base64
  const combined = new Uint8Array(nonce.length + encryptedBin.length);
  combined.set(nonce);
  combined.set(encryptedBin, nonce.length);

  return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
}

/**
 * Decrypt a value encrypted with a symmetric key using libsodium.
 * @internal - Exposed to test backwards compatibility. Use `decryptWithKey` instead.
 *
 * @param encryptedValue - The base64-encoded encrypted value with nonce
 * @param key - The decryption key
 * @returns The decrypted string
 */
export async function libsodiumDecrypt(
  encryptedValue: string,
  key: string,
): Promise<string> {
  const sodium = (await import("libsodium-wrappers")).default;
  // Initialize libsodium
  await sodium.ready;

  // Derive a key from the passphrase
  const cryptoKey = sodium.crypto_generichash(
    sodium.crypto_secretbox_KEYBYTES,
    sodium.from_string(key),
  );

  // Decode the base64 combined value
  const combined = sodium.from_base64(
    encryptedValue,
    sodium.base64_variants.ORIGINAL,
  );

  // Extract nonce and ciphertext
  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);

  // Decrypt the message
  const decryptedBin = sodium.crypto_secretbox_open_easy(
    ciphertext,
    nonce,
    cryptoKey,
  );

  return sodium.to_string(decryptedBin);
}
