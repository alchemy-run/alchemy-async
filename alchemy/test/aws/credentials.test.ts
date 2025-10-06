import { describe, expect, test } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  getGlobalAwsConfig,
  resolveAwsCredentials,
} from "../../src/aws/credentials.ts";
import { Scope } from "../../src/scope.ts";
import { Secret } from "../../src/secret.ts";

// Helper function to temporarily set environment variables for a test
async function withEnv<T>(
  envVars: Record<string, string | undefined>,
  fn: () => T | Promise<T>,
): Promise<T> {
  const originalValues: Record<string, string | undefined> = {};

  // Store original values and set new ones
  Object.keys(envVars).forEach((key) => {
    originalValues[key] = process.env[key];
    if (envVars[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = envVars[key];
    }
  });

  try {
    return await fn();
  } finally {
    // Restore original values
    Object.keys(envVars).forEach((key) => {
      if (originalValues[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValues[key];
      }
    });
  }
}

describe("AWS Credential Resolution", () => {
  describe("getGlobalAwsConfig", () => {
    test("should return empty config when no environment variables are set", async () => {
      const config = await withEnv(
        {
          AWS_ACCESS_KEY_ID: undefined,
          AWS_SECRET_ACCESS_KEY: undefined,
          AWS_SESSION_TOKEN: undefined,
          AWS_REGION: undefined,
          AWS_DEFAULT_REGION: undefined,
          AWS_PROFILE: undefined,
          AWS_ROLE_ARN: undefined,
          AWS_EXTERNAL_ID: undefined,
          AWS_ROLE_SESSION_NAME: undefined,
        },
        () => getGlobalAwsConfig(),
      );

      expect(config).toEqual({});
    });

    test("should read AWS credentials from environment variables", async () => {
      const config = await withEnv(
        {
          AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
          AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
          AWS_SESSION_TOKEN: "session-token",
          AWS_REGION: "us-west-2",
          AWS_PROFILE: "test-profile",
          AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/TestRole",
          AWS_EXTERNAL_ID: "external-id",
          AWS_ROLE_SESSION_NAME: "test-session",
        },
        () => getGlobalAwsConfig(),
      );

      // Check that secrets are properly created
      expect(Secret.unwrap(config.accessKeyId)).toBe("AKIAIOSFODNN7EXAMPLE");
      expect(Secret.unwrap(config.secretAccessKey)).toBe(
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      );
      expect(Secret.unwrap(config.sessionToken)).toBe("session-token");

      // Check non-secret properties
      expect(config.region).toBe("us-west-2");
      expect(config.profile).toBe("test-profile");
      expect(config.roleArn).toBe("arn:aws:iam::123456789012:role/TestRole");
      expect(config.externalId).toBe("external-id");
      expect(config.roleSessionName).toBe("test-session");
    });

    test("should prefer AWS_REGION over AWS_DEFAULT_REGION", async () => {
      const config = await withEnv(
        {
          AWS_REGION: "us-east-1",
          AWS_DEFAULT_REGION: "us-west-2",
        },
        () => getGlobalAwsConfig(),
      );

      expect(config.region).toBe("us-east-1");
    });

    test("should use AWS_DEFAULT_REGION when AWS_REGION is not set", async () => {
      const config = await withEnv(
        {
          AWS_REGION: undefined,
          AWS_DEFAULT_REGION: "us-west-2",
        },
        () => getGlobalAwsConfig(),
      );

      expect(config.region).toBe("us-west-2");
    });
  });

  describe("resolveAwsCredentials", () => {
    test("should return global config when no resource props provided", async () => {
      const resolved = await withEnv(
        {
          AWS_REGION: "us-west-2",
          AWS_PROFILE: "global-profile",
        },
        () => resolveAwsCredentials(),
      );

      // Check that the expected properties are present
      expect(resolved.region).toBe("us-west-2");
      expect(resolved.profile).toBe("global-profile");

      // The resolved config may contain additional properties from the environment,
      // but we only care about the ones we explicitly set
    });

    test("should merge scope credentials with global config", async () => {
      const resolved = await withEnv(
        {
          AWS_REGION: "us-west-2",
          AWS_PROFILE: "global-profile",
          AWS_ACCESS_KEY_ID: undefined,
          AWS_SECRET_ACCESS_KEY: undefined,
          AWS_SESSION_TOKEN: undefined,
          AWS_DEFAULT_REGION: undefined,
          AWS_ROLE_ARN: undefined,
          AWS_EXTERNAL_ID: undefined,
          AWS_ROLE_SESSION_NAME: undefined,
        },
        async () => {
          const scope = new Scope({
            scopeName: "test-scope",
            parent: undefined,
            phase: "up",
            noTrack: true,
            // Scope-level AWS credential overrides
            aws: {
              region: "eu-west-1", // Should override global
              accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
            },
          });

          return await scope.run(async () => resolveAwsCredentials());
        },
      );

      // Check that scope overrides work correctly
      expect(resolved.region).toBe("eu-west-1"); // From scope
      expect(resolved.profile).toBe("global-profile"); // From global env
      expect(Secret.unwrap(resolved.accessKeyId)).toBe("AKIAIOSFODNN7EXAMPLE"); // From scope
    });

    test("should prioritize resource props over scope and global config", async () => {
      const resolved = await withEnv(
        {
          AWS_REGION: "us-west-2",
          AWS_PROFILE: "global-profile",
          AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7GLOBAL",
          AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYGLOBAL",
        },
        async () => {
          const scope = new Scope({
            scopeName: "test-scope",
            parent: undefined,
            phase: "up",
            noTrack: true,
            // Scope-level AWS credential overrides
            aws: {
              region: "eu-central-1",
              profile: "scope-profile",
            },
          });

          return await scope.run(async () =>
            resolveAwsCredentials({
              region: "ap-southeast-1",
              accessKeyId: alchemy.secret("AKIAIOSFODNN7RESOURCE"),
            }),
          );
        },
      );

      // Check that resource props have highest priority
      expect(resolved.region).toBe("ap-southeast-1"); // From resource props (highest priority)
      expect(resolved.profile).toBe("scope-profile"); // From scope
      expect(Secret.unwrap(resolved.accessKeyId)).toBe("AKIAIOSFODNN7RESOURCE"); // From resource props
      expect(Secret.unwrap(resolved.secretAccessKey)).toBe(
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYGLOBAL",
      ); // From global env
    });

    test("should filter out undefined values from final result", async () => {
      const resolved = await withEnv(
        {
          AWS_REGION: "us-west-2",
          AWS_PROFILE: undefined,
          AWS_ACCESS_KEY_ID: undefined,
        },
        () =>
          resolveAwsCredentials({
            profile: "resource-profile",
          }),
      );

      // Check that undefined values are filtered out and resource props override
      expect(resolved.region).toBe("us-west-2");
      expect(resolved.profile).toBe("resource-profile");

      // accessKeyId should be undefined (filtered out)
      expect(resolved.accessKeyId).toBeUndefined();
    });

    test("should throw error for invalid resource properties", async () => {
      await expect(
        async () =>
          await resolveAwsCredentials({
            region: 123 as any, // Invalid type
          }),
      ).rejects.toThrow(
        /Invalid AWS configuration in resource properties.*Property 'region' must be a string/,
      );
    });

    test("should provide helpful error messages for validation failures", async () => {
      await expect(
        async () =>
          await resolveAwsCredentials({
            region: 123 as any,
            profile: true as any,
          }),
      ).rejects.toThrow(
        /Invalid AWS configuration in resource properties.*Property 'region' must be a string/,
      );
    });

    test("should handle complex credential resolution scenario", async () => {
      const resolved = await withEnv(
        {
          AWS_REGION: "us-west-2",
          AWS_PROFILE: "global-profile",
          AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7GLOBAL",
          AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYGLOBAL",
          AWS_SESSION_TOKEN: "global-session-token",
          AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/GlobalRole",
        },
        () =>
          resolveAwsCredentials({
            region: "eu-central-1",
            profile: "resource-profile",
            accessKeyId: alchemy.secret("AKIAIOSFODNN7RESOURCE"),
            // secretAccessKey and sessionToken should come from global
            roleArn: "arn:aws:iam::987654321098:role/ResourceRole",
          }),
      );

      // Check complex credential resolution scenario
      expect(resolved.region).toBe("eu-central-1"); // Resource override
      expect(resolved.profile).toBe("resource-profile"); // Resource override
      expect(Secret.unwrap(resolved.accessKeyId)).toBe("AKIAIOSFODNN7RESOURCE"); // Resource override
      expect(Secret.unwrap(resolved.secretAccessKey)).toBe(
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYGLOBAL",
      ); // Global
      expect(Secret.unwrap(resolved.sessionToken)).toBe("global-session-token"); // Global
      expect(resolved.roleArn).toBe(
        "arn:aws:iam::987654321098:role/ResourceRole",
      ); // Resource override
    });
  });
});
