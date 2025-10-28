import { describe, expect, it } from "vitest";
import { decryptWithKey, encrypt, libsodiumEncrypt } from "../src/encrypt.ts";

describe("encrypt", () => {
  it("encrypts and decrypts a string", async () => {
    const passphrase = crypto.randomUUID();
    const value = "test-value";
    const encrypted = await encrypt(value, passphrase);
    expect(encrypted).toMatchObject({
      version: "v1",
      ciphertext: expect.any(String),
      iv: expect.any(String),
      salt: expect.any(String),
      tag: expect.any(String),
    });
    const decrypted = await decryptWithKey(encrypted, passphrase);
    expect(decrypted).toBe(value);
  });

  it("decrypts a string encrypted with libsodium", async () => {
    const passphrase = crypto.randomUUID();
    const value = "test-value";
    const encrypted = await libsodiumEncrypt(value, passphrase);
    const decrypted = await decryptWithKey(encrypted, passphrase);
    expect(decrypted).toBe(value);
  });

  it("fails to decrypt from libsodium with incorrect passphrase", async () => {
    const passphrase = crypto.randomUUID();
    const value = "test-value";
    const encrypted = await libsodiumEncrypt(value, passphrase);
    await expect(
      decryptWithKey(encrypted, crypto.randomUUID()),
    ).rejects.toThrow();
  });

  it("fails to decrypt from aes-256-gcm with incorrect passphrase", async () => {
    const passphrase = crypto.randomUUID();
    const value = "test-value";
    const encrypted = await encrypt(value, passphrase);
    expect(encrypted).toMatchObject({
      version: "v1",
      ciphertext: expect.any(String),
      iv: expect.any(String),
      salt: expect.any(String),
      tag: expect.any(String),
    });
    await expect(
      decryptWithKey(encrypted, crypto.randomUUID()),
    ).rejects.toThrow();
  });
});
