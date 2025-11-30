import { describe, expect, it } from "vitest";
import { camelToSnakeObjectDeep } from "../../src/util/camel-to-snake.ts";

describe("camelToSnakeObjectDeep", () => {
  describe("null and undefined handling", () => {
    it("returns undefined for undefined input", () => {
      const result = camelToSnakeObjectDeep(undefined);
      expect(result).toBeUndefined();
    });

    it("returns null for null input", () => {
      const result = camelToSnakeObjectDeep(null);
      expect(result).toBeNull();
    });
  });

  describe("primitive types", () => {
    it("returns string as-is", () => {
      const result = camelToSnakeObjectDeep("hello");
      expect(result).toBe("hello");
    });

    it("returns number as-is", () => {
      const result = camelToSnakeObjectDeep(42);
      expect(result).toBe(42);
    });

    it("returns boolean as-is", () => {
      const result = camelToSnakeObjectDeep(true);
      expect(result).toBe(true);
    });

    it("returns false boolean as-is", () => {
      const result = camelToSnakeObjectDeep(false);
      expect(result).toBe(false);
    });
  });

  describe("simple camelCase to snake_case conversion", () => {
    it("converts simple camelCase key", () => {
      const result = camelToSnakeObjectDeep({ fooBar: "value" });
      expect(result).toEqual({ foo_bar: "value" });
    });

    it("converts multiple camelCase keys", () => {
      const result = camelToSnakeObjectDeep({
        firstName: "John",
        lastName: "Doe",
        emailAddress: "john@example.com",
      });
      expect(result).toEqual({
        first_name: "John",
        last_name: "Doe",
        email_address: "john@example.com",
      });
    });

    it("converts key with multiple humps", () => {
      const result = camelToSnakeObjectDeep({ fooBarBaz: "value" });
      expect(result).toEqual({ foo_bar_baz: "value" });
    });

    it("preserves lowercase single word key", () => {
      const result = camelToSnakeObjectDeep({ foo: "value" });
      expect(result).toEqual({ foo: "value" });
    });

    it("converts capitalized single word key to lowercase", () => {
      const result = camelToSnakeObjectDeep({ Foo: "value" });
      expect(result).toEqual({ foo: "value" });
    });
  });

  describe("consecutive capitals handling", () => {
    it("handles FOOBar pattern", () => {
      const result = camelToSnakeObjectDeep({ FOOBar: "value" });
      expect(result).toEqual({ foo_bar: "value" });
    });

    it("handles XMLParser pattern", () => {
      const result = camelToSnakeObjectDeep({ XMLParser: "value" });
      expect(result).toEqual({ xml_parser: "value" });
    });

    it("handles getHTTPResponse pattern", () => {
      const result = camelToSnakeObjectDeep({ getHTTPResponse: "value" });
      expect(result).toEqual({ get_http_response: "value" });
    });

    it("handles all caps key", () => {
      const result = camelToSnakeObjectDeep({ FOO: "value" });
      expect(result).toEqual({ foo: "value" });
    });

    it("handles ID suffix", () => {
      const result = camelToSnakeObjectDeep({ userID: "value" });
      expect(result).toEqual({ user_id: "value" });
    });

    it("handles URL prefix", () => {
      const result = camelToSnakeObjectDeep({ URLPath: "value" });
      expect(result).toEqual({ url_path: "value" });
    });

    it("handles multiple consecutive capital sequences", () => {
      // Note: Current implementation produces "get_htmlurl_parser" - adjacent acronyms are merged
      const result = camelToSnakeObjectDeep({ getHTMLURLParser: "value" });
      expect(result).toEqual({ get_htmlurl_parser: "value" });
    });
  });

  describe("array handling", () => {
    it("handles array of primitives", () => {
      const result = camelToSnakeObjectDeep([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it("handles array of strings", () => {
      const result = camelToSnakeObjectDeep(["a", "b", "c"]);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("handles object with arrays of strings", () => {
      const result = camelToSnakeObjectDeep({ someArray: ["a", "b", "c"] });
      expect(result).toEqual({ some_array: ["a", "b", "c"] });
    });

    it("handles array of objects", () => {
      const result = camelToSnakeObjectDeep([
        { firstName: "John" },
        { firstName: "Jane" },
      ]);
      expect(result).toEqual([{ first_name: "John" }, { first_name: "Jane" }]);
    });

    it("handles empty array", () => {
      const result = camelToSnakeObjectDeep([]);
      expect(result).toEqual([]);
    });

    it("handles mixed array of objects and primitives", () => {
      const result = camelToSnakeObjectDeep([
        { fooBar: "value" },
        42,
        "string",
        null,
      ]);
      expect(result).toEqual([{ foo_bar: "value" }, 42, "string", null]);
    });
  });

  describe("nested objects", () => {
    it("handles nested object", () => {
      const result = camelToSnakeObjectDeep({
        outerKey: {
          innerKey: "value",
        },
      });
      expect(result).toEqual({
        outer_key: {
          inner_key: "value",
        },
      });
    });

    it("handles deeply nested objects", () => {
      const result = camelToSnakeObjectDeep({
        outerLevel: {
          middleLevel: {
            innerLevel: {
              deepValue: "value",
            },
          },
        },
      });
      expect(result).toEqual({
        outer_level: {
          middle_level: {
            inner_level: {
              deep_value: "value",
            },
          },
        },
      });
    });

    it("handles object with array property", () => {
      const result = camelToSnakeObjectDeep({
        userList: [{ firstName: "John" }, { firstName: "Jane" }],
      });
      expect(result).toEqual({
        user_list: [{ first_name: "John" }, { first_name: "Jane" }],
      });
    });

    it("handles object with mixed nested content", () => {
      const result = camelToSnakeObjectDeep({
        userName: "John",
        userDetails: {
          phoneNumber: "123-456-7890",
          emailAddresses: ["john@example.com", "doe@example.com"],
        },
        userRoles: [
          { roleName: "admin", roleID: 1 },
          { roleName: "user", roleID: 2 },
        ],
      });
      expect(result).toEqual({
        user_name: "John",
        user_details: {
          phone_number: "123-456-7890",
          email_addresses: ["john@example.com", "doe@example.com"],
        },
        user_roles: [
          { role_name: "admin", role_id: 1 },
          { role_name: "user", role_id: 2 },
        ],
      });
    });
  });

  describe("edge cases", () => {
    it("handles empty object", () => {
      const result = camelToSnakeObjectDeep({});
      expect(result).toEqual({});
    });

    it("handles key with number suffix", () => {
      const result = camelToSnakeObjectDeep({ item1: "value", item2: "value" });
      expect(result).toEqual({ item1: "value", item2: "value" });
    });

    it("handles key with number in middle", () => {
      // Note: Current implementation doesn't add underscore after numbers
      // user2Name -> user2name (number followed by uppercase is not separated)
      const result = camelToSnakeObjectDeep({ user2Name: "value" });
      expect(result).toEqual({ user2name: "value" });
    });

    it("handles already snake_case key", () => {
      const result = camelToSnakeObjectDeep({ already_snake: "value" });
      expect(result).toEqual({ already_snake: "value" });
    });

    it("handles single character key", () => {
      const result = camelToSnakeObjectDeep({ a: "value" });
      expect(result).toEqual({ a: "value" });
    });

    it("handles single uppercase character key", () => {
      const result = camelToSnakeObjectDeep({ A: "value" });
      expect(result).toEqual({ a: "value" });
    });

    it("handles two character camelCase key", () => {
      const result = camelToSnakeObjectDeep({ aB: "value" });
      expect(result).toEqual({ a_b: "value" });
    });

    it("handles key starting with uppercase", () => {
      const result = camelToSnakeObjectDeep({ FirstName: "value" });
      expect(result).toEqual({ first_name: "value" });
    });

    it("handles value with null", () => {
      const result = camelToSnakeObjectDeep({ fooBar: null });
      expect(result).toEqual({ foo_bar: null });
    });

    it("handles value with undefined", () => {
      const result = camelToSnakeObjectDeep({ fooBar: undefined });
      expect(result).toEqual({ foo_bar: undefined });
    });
  });

  describe("complex real-world examples", () => {
    it("handles API response style object", () => {
      const result = camelToSnakeObjectDeep({
        userId: 123,
        userName: "john_doe",
        createdAt: "2023-01-01T00:00:00Z",
        isActive: true,
        profileSettings: {
          darkMode: false,
          notificationsEnabled: true,
          preferredLanguage: "en",
        },
      });
      expect(result).toEqual({
        user_id: 123,
        user_name: "john_doe",
        created_at: "2023-01-01T00:00:00Z",
        is_active: true,
        profile_settings: {
          dark_mode: false,
          notifications_enabled: true,
          preferred_language: "en",
        },
      });
    });

    it("handles LogPushProps style object", () => {
      const result = camelToSnakeObjectDeep({
        maxFooBar: "test",
        logLevel: "debug",
        retryCount: 3,
      });
      expect(result).toEqual({
        max_foo_bar: "test",
        log_level: "debug",
        retry_count: 3,
      });
    });

    it("handles config object with nested arrays and objects", () => {
      const result = camelToSnakeObjectDeep({
        serverConfig: {
          hostName: "localhost",
          portNumber: 8080,
          sslEnabled: true,
        },
        databaseConnections: [
          {
            connectionName: "primary",
            maxPoolSize: 10,
            timeoutMs: 5000,
          },
          {
            connectionName: "replica",
            maxPoolSize: 5,
            timeoutMs: 3000,
          },
        ],
        featureFlags: {
          enableNewUI: true,
          enableBetaFeatures: false,
        },
      });
      expect(result).toEqual({
        server_config: {
          host_name: "localhost",
          port_number: 8080,
          ssl_enabled: true,
        },
        database_connections: [
          {
            connection_name: "primary",
            max_pool_size: 10,
            timeout_ms: 5000,
          },
          {
            connection_name: "replica",
            max_pool_size: 5,
            timeout_ms: 3000,
          },
        ],
        feature_flags: {
          enable_new_ui: true,
          enable_beta_features: false,
        },
      });
    });
  });

  describe("type preservation", () => {
    it("converts Date objects to empty objects", () => {
      // Note: Current implementation recurses into Date objects, converting them to empty {}
      // This is a known limitation - Date objects are treated as regular objects
      const date = new Date("2023-01-01");
      const result = camelToSnakeObjectDeep({ createdAt: date });
      expect(result).toEqual({ created_at: {} });
    });

    it("preserves RegExp values", () => {
      const regex = /test/gi;
      const result = camelToSnakeObjectDeep({ patternMatch: regex });
      expect(result).toEqual({ pattern_match: regex });
      expect((result as any).pattern_match).toBeInstanceOf(RegExp);
    });

    it("preserves number types", () => {
      const result = camelToSnakeObjectDeep({
        intValue: 42,
        floatValue: 3.14,
        negativeValue: -10,
        zeroValue: 0,
      });
      expect(result).toEqual({
        int_value: 42,
        float_value: 3.14,
        negative_value: -10,
        zero_value: 0,
      });
    });

    it("preserves boolean types", () => {
      const result = camelToSnakeObjectDeep({
        isEnabled: true,
        isDisabled: false,
      });
      expect(result).toEqual({
        is_enabled: true,
        is_disabled: false,
      });
    });
  });
});
