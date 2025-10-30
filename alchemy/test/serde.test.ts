import { describe, expect } from "vitest";
import { alchemy } from "../src/alchemy.ts";
import { Secret } from "../src/secret.ts";
import { deserialize, serialize } from "../src/serde.ts";
import { BRANCH_PREFIX } from "./util.ts";

import { destroy } from "../src/destroy.ts";
import "../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("serde", async () => {
  test("serializes and deserializes primitive values", async (scope) => {
    try {
      // Test primitive values
      const testCases = [42, "hello", true, null, undefined];

      for (const value of testCases) {
        const serialized = await serialize(scope, value);
        const deserialized = await deserialize(scope, serialized);
        expect(deserialized).toEqual(value);
      }
    } finally {
      await destroy(scope);
    }
  });

  test("serializes and deserializes arrays", async (scope) => {
    try {
      const array = [1, "two", true, null];

      const serialized = await serialize(scope, array);
      const deserialized = await deserialize(scope, serialized);
      expect(deserialized).toEqual(array);
    } finally {
      await destroy(scope);
    }
  });

  test("serializes and deserializes nested objects", async (scope) => {
    try {
      const obj = {
        a: 1,
        b: {
          c: "hello",
          d: [1, 2, 3],
          e: {
            f: true,
          },
        },
      };

      const serialized = await serialize(scope, obj);
      const deserialized = await deserialize(scope, serialized);
      expect(deserialized).toEqual(obj);
    } finally {
      await destroy(scope);
    }
  });

  test("serializes and deserializes secrets", async (scope) => {
    try {
      const secret = alchemy.secret("sensitive-data");

      const serialized = await serialize(scope, secret);
      expect(serialized).toHaveProperty("@secret");
      expect(serialized["@secret"]).toMatchObject({
        version: "v1",
        ciphertext: expect.any(String),
        iv: expect.any(String),
        salt: expect.any(String),
        tag: expect.any(String),
      });
      expect(serialized["@secret"]).not.toContain("sensitive-data");

      const deserialized = await deserialize(scope, serialized);
      expect(deserialized).toBeInstanceOf(Secret);
      expect(deserialized.unencrypted).toBe("sensitive-data");
    } finally {
      await destroy(scope);
    }
  });

  test("serializes and deserializes complex object secrets", async (scope) => {
    try {
      const complexSecretData = {
        apiKey: "sk-1234567890abcdef",
        endpoint: "https://api.example.com",
        metadata: {
          version: "v1",
          region: "us-east-1",
        },
      };
      const secret = alchemy.secret(complexSecretData);

      const serialized = await serialize(scope, secret);
      expect(serialized).toHaveProperty("@secret");
      expect(serialized["@secret"]).toMatchObject({
        data: {
          version: "v1",
          ciphertext: expect.any(String),
          iv: expect.any(String),
          salt: expect.any(String),
          tag: expect.any(String),
        },
      });
      expect(serialized["@secret"].data).not.toContain("sk-1234567890abcdef");

      const deserialized = await deserialize(scope, serialized);
      expect(deserialized).toBeInstanceOf(Secret);
      expect(deserialized.unencrypted).toEqual(complexSecretData);
      expect(deserialized.unencrypted.apiKey).toBe("sk-1234567890abcdef");
      expect(deserialized.unencrypted.endpoint).toBe("https://api.example.com");
      expect(deserialized.unencrypted.metadata.version).toBe("v1");
      expect(deserialized.unencrypted.metadata.region).toBe("us-east-1");
    } finally {
      await destroy(scope);
    }
  });

  test("serializes scope to undefined", async (scope) => {
    try {
      const objWithScope = {
        scope: scope,
        data: "test",
      };

      const serialized = await serialize(scope, objWithScope);
      expect(serialized).toEqual({
        scope: {
          "@scope": null,
        },
        data: "test",
      });
    } finally {
      await destroy(scope);
    }
  });

  test("handles complex objects with secrets", async (scope) => {
    try {
      const complexObj = {
        name: "test",
        credentials: {
          username: "user",
          password: alchemy.secret("super-secret"),
          apiKey: alchemy.secret("api-key-123"),
        },
        settings: {
          enabled: true,
          tokens: [alchemy.secret("token1"), alchemy.secret("token2")],
        },
      };

      const serialized = await serialize(scope, complexObj);
      const deserialized = await deserialize(scope, serialized);

      // Verify structure
      expect(deserialized).toHaveProperty("name", "test");
      expect(deserialized.credentials.username).toBe("user");
      expect(deserialized.credentials.password).toBeInstanceOf(Secret);
      expect(deserialized.credentials.password.unencrypted).toBe(
        "super-secret",
      );
      expect(deserialized.credentials.apiKey.unencrypted).toBe("api-key-123");
      expect(deserialized.settings.enabled).toBe(true);

      expect(deserialized.settings.tokens[0].unencrypted).toBe("token1");
      expect(deserialized.settings.tokens[1].unencrypted).toBe("token2");
    } finally {
      await destroy(scope);
    }
  });

  test("decrypts complex objects with secrets encoded by libsodium", async (scope) => {
    try {
      const encrypted = {
        name: "test",
        credentials: {
          username: "user",
          password: {
            "@secret":
              "yGFwMrw2A2ZOuDNgg3S/aDJTYeDSO3KRxC/QrICkznZZsVKAib+VlLmwv6NbLOpFOIbXoA==",
          },
          apiKey: {
            "@secret":
              "VHD8Lt+5vTse5Qh5U5cgzFuAd31zLmWkbPlPTn6lrn15ux4KOQAjoi+ml/4CNHknw81H",
          },
        },
        settings: {
          enabled: true,
          tokens: [
            {
              "@secret":
                "d5RfcYaucutM6Vy2sixa3MihNmu76ordWlPz+koWj9wQmSqZYOXdPSVZv97Ogw==",
            },
            {
              "@secret":
                "gC9xHgqvEg3Bt30X3DUPD1Kcqa91Xe99/tIrmqu1HjfHcdO+6qsas9GuxuvtWQ==",
            },
          ],
        },
      };
      const deserialized = await deserialize(scope, encrypted);

      // Verify structure
      expect(deserialized).toHaveProperty("name", "test");
      expect(deserialized.credentials.username).toBe("user");
      expect(deserialized.credentials.password).toBeInstanceOf(Secret);
      expect(deserialized.credentials.password.unencrypted).toBe(
        "super-secret",
      );
      expect(deserialized.credentials.apiKey.unencrypted).toBe("api-key-123");
      expect(deserialized.settings.enabled).toBe(true);

      expect(deserialized.settings.tokens[0].unencrypted).toBe("token1");
      expect(deserialized.settings.tokens[1].unencrypted).toBe("token2");
    } finally {
      await destroy(scope);
    }
  });

  test("props", async (scope) => {
    try {
      const props = {
        name: "alchemy.run",
        type: "full",
      };
      const serialized = await serialize(scope, props);
      expect(serialized).toEqual(props);
    } finally {
      await destroy(scope);
    }
  });

  test("symbol property", async (scope) => {
    try {
      const props = {
        [Symbol.for("foo")]: "bar",
      };

      const serialized = await serialize(scope, props);
      expect(serialized).toEqual({
        "Symbol(foo)": "bar",
      });
      expect(await deserialize(scope, serialized)).toEqual(props);
    } finally {
      await destroy(scope);
    }
  });

  test("symbol value", async (scope) => {
    try {
      const props = {
        foo: Symbol.for("bar"),
      };

      const serialized = await serialize(scope, props);
      expect(serialized).toEqual({
        foo: {
          "@symbol": "Symbol(bar)",
        },
      });
      expect(await deserialize(scope, serialized)).toEqual(props);
    } finally {
      await destroy(scope);
    }
  });

  test("unique symbol property should error", async (scope) => {
    try {
      await expect(
        serialize(scope, {
          [Symbol()]: "bar",
        }),
      ).rejects.toThrow();
      await expect(
        serialize(scope, {
          [Symbol("foo")]: "bar",
        }),
      ).rejects.toThrow();
    } finally {
      await destroy(scope);
    }
  });

  test("unique symbol value should error", async (scope) => {
    try {
      await expect(
        serialize(scope, {
          foo: Symbol(),
        }),
      ).rejects.toThrow();
      await expect(
        serialize(scope, {
          foo: Symbol("bar"),
        }),
      ).rejects.toThrow();
    } finally {
      await destroy(scope);
    }
  });
});
