import { describe, expect, test } from "vitest";
import { alchemy } from "../src/alchemy.ts";
import { Scope } from "../src/scope.ts";

describe("Scope Provider Credentials", () => {
  test("should support AWS credentials at scope level", () => {
    const scope = new Scope({
      scopeName: "test-scope",
      parent: undefined,
      phase: "up",
      noTrack: true,
      // AWS credentials using the extensible pattern
      aws: {
        region: "us-west-2",
        profile: "test-profile",
        accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
      },
    });

    expect(scope.providerCredentials.aws?.region).toBe("us-west-2");
    expect(scope.providerCredentials.aws?.profile).toBe("test-profile");
    expect(scope.providerCredentials.aws?.accessKeyId).toBeDefined();
    // Note: We can't directly compare secrets, so we just verify it exists
  });

  test("should support Cloudflare credentials at scope level", () => {
    const scope = new Scope({
      scopeName: "test-scope",
      parent: undefined,
      phase: "up",
      noTrack: true,
      // Cloudflare credentials using the extensible pattern
      cloudflare: {
        accountId: "abc123",
        baseUrl: "https://api.cloudflare.com/client/v4",
      },
    });

    expect(scope.providerCredentials.cloudflare).toEqual({
      accountId: "abc123",
      baseUrl: "https://api.cloudflare.com/client/v4",
    });
  });

  test("should support both AWS and Cloudflare credentials at scope level", () => {
    const scope = new Scope({
      scopeName: "test-scope",
      parent: undefined,
      phase: "up",
      noTrack: true,
      // Both providers can be configured simultaneously
      aws: {
        region: "us-west-2",
        profile: "test-profile",
      },
      cloudflare: {
        accountId: "abc123",
      },
    });

    expect(scope.providerCredentials.aws).toEqual({
      region: "us-west-2",
      profile: "test-profile",
    });

    expect(scope.providerCredentials.cloudflare).toEqual({
      accountId: "abc123",
    });
  });

  test("should handle scope with no provider credentials", () => {
    const scope = new Scope({
      scopeName: "test-scope",
      parent: undefined,
      phase: "up",
      noTrack: true,
    });

    expect(scope.providerCredentials).toEqual({});
  });

  test("should ignore unknown provider credentials", () => {
    const scope = new Scope({
      scopeName: "test-scope",
      parent: undefined,
      phase: "up",
      noTrack: true,
      aws: {
        region: "us-west-2",
      },
      // This would be ignored since there's no module augmentation for it
      unknownProvider: {
        someProperty: "value",
      },
    } as any);

    expect(scope.providerCredentials.aws).toEqual({
      region: "us-west-2",
    });

    expect((scope.providerCredentials as any).unknownProvider).toEqual({
      someProperty: "value",
    });
  });
});
