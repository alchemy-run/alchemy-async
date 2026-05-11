import { describe, expect, test } from "vitest";
import { awsEndpoint, hasAwsEndpointOverride } from "../../src/aws/utils.ts";

const ENDPOINT_ENV_VARS = [
  "AWS_ENDPOINT_URL",
  "AWS_ENDPOINT_URL_EC2",
  "AWS_ENDPOINT_URL_S3",
  "AWS_ENDPOINT_URL_CLOUDCONTROLAPI",
  "AWS_ENDPOINT_URL_API_GATEWAY",
] as const;

// Helper to run a test with a fully-specified endpoint env. All endpoint
// vars not explicitly provided are cleared so tests can't pollute each other
// or inherit values from the host environment.
async function withEndpointEnv<T>(
  envVars: Partial<Record<(typeof ENDPOINT_ENV_VARS)[number], string>>,
  fn: () => T | Promise<T>,
): Promise<T> {
  const originalValues: Record<string, string | undefined> = {};

  for (const key of ENDPOINT_ENV_VARS) {
    originalValues[key] = process.env[key];
    const next = envVars[key];
    if (next === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = next;
    }
  }

  try {
    return await fn();
  } finally {
    for (const key of ENDPOINT_ENV_VARS) {
      if (originalValues[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValues[key];
      }
    }
  }
}

describe("awsEndpoint", () => {
  test("returns default AWS endpoint when no env var is set", async () => {
    await withEndpointEnv({}, () => {
      expect(awsEndpoint("ec2", "us-east-1")).toBe(
        "https://ec2.us-east-1.amazonaws.com",
      );
      expect(awsEndpoint("s3", "eu-west-2")).toBe(
        "https://s3.eu-west-2.amazonaws.com",
      );
    });
  });

  test("honours global AWS_ENDPOINT_URL override", async () => {
    await withEndpointEnv({ AWS_ENDPOINT_URL: "http://localhost:4566" }, () => {
      expect(awsEndpoint("ec2", "us-east-1")).toBe("http://localhost:4566");
      expect(awsEndpoint("cloudcontrolapi", "us-east-1")).toBe(
        "http://localhost:4566",
      );
    });
  });

  test("service-specific override takes precedence over global", async () => {
    await withEndpointEnv(
      {
        AWS_ENDPOINT_URL: "http://localhost:4566",
        AWS_ENDPOINT_URL_EC2: "http://localhost:5000",
      },
      () => {
        expect(awsEndpoint("ec2", "us-east-1")).toBe("http://localhost:5000");
        expect(awsEndpoint("s3", "us-east-1")).toBe("http://localhost:4566");
      },
    );
  });

  test("strips trailing slashes from override", async () => {
    await withEndpointEnv(
      { AWS_ENDPOINT_URL: "http://localhost:4566///" },
      () => {
        expect(awsEndpoint("ec2", "us-east-1")).toBe("http://localhost:4566");
      },
    );
  });

  test("normalises hyphenated services to underscored env var name", async () => {
    await withEndpointEnv(
      { AWS_ENDPOINT_URL_API_GATEWAY: "http://localhost:9999" },
      () => {
        expect(awsEndpoint("api-gateway", "us-east-1")).toBe(
          "http://localhost:9999",
        );
      },
    );
  });
});

describe("hasAwsEndpointOverride", () => {
  test("returns false when no env var is set", async () => {
    await withEndpointEnv({}, () => {
      expect(hasAwsEndpointOverride("s3")).toBe(false);
    });
  });

  test("returns true when global override is set", async () => {
    await withEndpointEnv({ AWS_ENDPOINT_URL: "http://localhost:4566" }, () => {
      expect(hasAwsEndpointOverride("s3")).toBe(true);
      expect(hasAwsEndpointOverride("ec2")).toBe(true);
    });
  });

  test("returns true when service-specific override is set", async () => {
    await withEndpointEnv(
      { AWS_ENDPOINT_URL_S3: "http://localhost:4566" },
      () => {
        expect(hasAwsEndpointOverride("s3")).toBe(true);
        expect(hasAwsEndpointOverride("ec2")).toBe(false);
      },
    );
  });
});
