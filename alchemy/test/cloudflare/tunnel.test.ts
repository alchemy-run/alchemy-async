import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  type CloudflareApi,
  createCloudflareApi,
} from "../../src/cloudflare/api.ts";
import {
  Tunnel,
  getTunnel,
  getTunnelConfiguration,
  listTunnels,
} from "../../src/cloudflare/tunnel.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import { Secret } from "../../src/index.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const TEST_DOMAIN = process.env.TEST_DOMAIN ?? process.env.ALCHEMY_TEST_DOMAIN!;

describe("Tunnel Resource", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-tunnel`;

  test("create, update, and delete tunnel", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: Tunnel | undefined;

    try {
      // Create a tunnel with basic configuration
      tunnel = await Tunnel(testId, {
        name: `${testId}-initial`,
        ingress: [
          {
            hostname: `test.${TEST_DOMAIN}`,
            service: "http://localhost:8080",
          },
          {
            service: "http_status:404", // catch-all rule
          },
        ],
        adopt: true,
      });

      // Verify tunnel was created
      expect(tunnel).toMatchObject({
        tunnelId: expect.any(String),
        name: `${testId}-initial`,
        createdAt: expect.any(String),
        deletedAt: null,
        credentials: expect.any(Object),
        token: expect.any(Secret),
        ingress: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
        ]),
      });

      // Verify tunnel exists via API
      expect(await getTunnel(api, tunnel.tunnelId)).toMatchObject({
        name: `${testId}-initial`,
      });

      // Verify configuration was applied
      expect(await getTunnelConfiguration(api, tunnel.tunnelId)).toMatchObject({
        ingress: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
        ]),
      });

      // Update the tunnel with new configuration
      tunnel = await Tunnel(testId, {
        name: `${testId}-updated`,
        ingress: [
          {
            hostname: `app.${TEST_DOMAIN}`,
            service: "http://localhost:3000",
          },
          {
            hostname: `api.${TEST_DOMAIN}`,
            service: "http://localhost:8080",
            originRequest: {
              httpHostHeader: "api.internal",
              connectTimeout: 30,
            },
          },
          {
            service: "http_status:404",
          },
        ],
        warpRouting: {
          enabled: true,
        },
      });

      // Verify tunnel was updated
      expect(tunnel).toMatchObject({
        name: `${testId}-updated`,
        ingress: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
        ]),
        warpRouting: {
          enabled: true,
        },
      });

      // Verify updated configuration via API
      expect(await getTunnelConfiguration(api, tunnel.tunnelId)).toMatchObject({
        ingress: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
        ]),
        warpRouting: {
          enabled: true,
        },
      });
    } catch (err) {
      // Log the error or else it's silently swallowed by destroy errors
      console.error("Test error:", err);
      throw err;
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });

  test("tunnel without catch-all rule fails", async (scope) => {
    const tunnelId = `${BRANCH_PREFIX}-no-catchall`;

    // Cloudflare API requires a catch-all rule - this should fail
    await expect(async () => {
      await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        ingress: [
          {
            hostname: `app.${TEST_DOMAIN}`,
            service: "http://localhost:3000",
          },
          {
            hostname: `api.${TEST_DOMAIN}`,
            service: "http://localhost:8080",
          },
          // NO catch-all rule here - this should cause an error!
        ],
        adopt: true,
      });
    }).rejects.toThrow("The last ingress rule must match all URLs");

    // Clean up in case anything was partially created
    await destroy(scope);
  });

  test("different service types", async (scope) => {
    const api = await createCloudflareApi();
    const tunnelId = `${BRANCH_PREFIX}-service-types`;
    let tunnel: Tunnel | undefined;

    try {
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        ingress: [
          {
            hostname: `web.${TEST_DOMAIN}`,
            service: "http://localhost:3000",
          },
          {
            hostname: `secure.${TEST_DOMAIN}`,
            service: "https://localhost:8443",
          },
          {
            hostname: `ssh.${TEST_DOMAIN}`,
            service: "ssh://localhost:22",
          },
          {
            hostname: `tcp.${TEST_DOMAIN}`,
            service: "tcp://localhost:5432",
          },
          {
            service: "http_status:503", // Service unavailable instead of 404
          },
        ],
        adopt: true,
      });

      expect(tunnel).toMatchObject({
        tunnelId: expect.any(String),
        name: `${tunnelId}-test`,
      });

      const config = await getTunnelConfiguration(api, tunnel.tunnelId);
      expect(config.ingress).toHaveLength(5);

      // Verify each service type
      expect(config.ingress?.[0].service).toBe("http://localhost:3000");
      expect(config.ingress?.[1].service).toBe("https://localhost:8443");
      expect(config.ingress?.[2].service).toBe("ssh://localhost:22");
      expect(config.ingress?.[3].service).toBe("tcp://localhost:5432");
      expect(config.ingress?.[4].service).toBe("http_status:503");
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });

  test("path-based routing", async (scope) => {
    const api = await createCloudflareApi();
    const tunnelId = `${BRANCH_PREFIX}-path-routing`;
    let tunnel: Tunnel | undefined;

    try {
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        ingress: [
          {
            hostname: `app.${TEST_DOMAIN}`,
            path: "/api/*",
            service: "http://localhost:8080",
          },
          {
            hostname: `app.${TEST_DOMAIN}`,
            path: "/admin/*",
            service: "http://localhost:8081",
          },
          {
            hostname: `app.${TEST_DOMAIN}`,
            service: "http://localhost:3000", // Default for same hostname
          },
          {
            service: "http_status:404",
          },
        ],
        adopt: true,
      });

      expect(tunnel).toMatchObject({
        tunnelId: expect.any(String),
        name: `${tunnelId}-test`,
      });

      const config = await getTunnelConfiguration(api, tunnel.tunnelId);
      expect(config.ingress).toHaveLength(4);

      // Verify path-based rules come before hostname-only rules
      expect(config.ingress?.[0]).toMatchObject({
        hostname: `app.${TEST_DOMAIN}`,
        path: "/api/*",
        service: "http://localhost:8080",
      });
      expect(config.ingress?.[1]).toMatchObject({
        hostname: `app.${TEST_DOMAIN}`,
        path: "/admin/*",
        service: "http://localhost:8081",
      });
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });

  test("wildcard hostname routing", async (scope) => {
    const api = await createCloudflareApi();
    const tunnelId = `${BRANCH_PREFIX}-wildcard`;
    let tunnel: Tunnel | undefined;

    try {
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        ingress: [
          {
            hostname: `*.preview.${TEST_DOMAIN}`,
            service: "http://localhost:3000",
          },
          {
            hostname: `*.${TEST_DOMAIN}`,
            service: "http://localhost:8080",
          },
          {
            service: "http_status:404",
          },
        ],
        adopt: true,
      });

      expect(tunnel).toMatchObject({
        tunnelId: expect.any(String),
        name: `${tunnelId}-test`,
      });

      // Wildcard hostnames should not create DNS records
      expect(tunnel.dnsRecords).toBeUndefined();
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });

  test("origin request configurations", async (scope) => {
    const api = await createCloudflareApi();
    const tunnelId = `${BRANCH_PREFIX}-origin-request`;
    let tunnel: Tunnel | undefined;

    try {
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        ingress: [
          {
            hostname: `api.${TEST_DOMAIN}`,
            service: "http://localhost:8080",
            originRequest: {
              httpHostHeader: "api.internal",
              connectTimeout: 30,
              tlsTimeout: 10,
              noTLSVerify: true,
              disableChunkedEncoding: true,
              http2Origin: true,
              caPool: "/etc/ssl/certs/ca-certificates.crt",
              noHappyEyeballs: true,
              keepAliveConnections: 100,
              keepAliveTimeout: 90,
              proxyAddress: "proxy.example.com",
              proxyPort: 8888,
              proxyType: "socks",
            },
          },
          {
            service: "http_status:404",
          },
        ],
        originRequest: {
          // Global origin request settings
          connectTimeout: 60,
          tlsTimeout: 20,
          http2Origin: false,
        },
        adopt: true,
      });

      expect(tunnel).toMatchObject({
        tunnelId: expect.any(String),
        name: `${tunnelId}-test`,
      });

      const config = await getTunnelConfiguration(api, tunnel.tunnelId);
      expect(config.ingress?.[0].originRequest).toMatchObject({
        httpHostHeader: "api.internal",
        connectTimeout: 30,
        tlsTimeout: 10,
        noTLSVerify: true,
      });
      expect(config.originRequest).toMatchObject({
        connectTimeout: 60,
        tlsTimeout: 20,
        http2Origin: false,
      });
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });

  test("local configuration mode", async (scope) => {
    const api = await createCloudflareApi();
    const tunnelId = `${BRANCH_PREFIX}-local-config`;
    let tunnel: Tunnel | undefined;

    try {
      // Create tunnel with local config mode - ingress should be ignored
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        configSrc: "local",
        ingress: [
          {
            hostname: `test.${TEST_DOMAIN}`,
            service: "http://localhost:3000",
          },
          {
            service: "http_status:404",
          },
        ],
        adopt: true,
      });

      expect(tunnel).toMatchObject({
        tunnelId: expect.any(String),
        name: `${tunnelId}-test`,
        configSrc: "local",
      });

      // Configuration should not be set when using local mode
      try {
        await getTunnelConfiguration(api, tunnel.tunnelId);
        // If we get here, the configuration was set (which shouldn't happen)
        expect.fail("Configuration should not be set in local mode");
      } catch (err) {
        // Expected - no configuration should be set
        expect(err).toBeDefined();
      }
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });

  test("minimal tunnel configuration", async (scope) => {
    const api = await createCloudflareApi();
    const tunnelId = `${BRANCH_PREFIX}-minimal`;
    let tunnel: Tunnel | undefined;

    try {
      // Create tunnel with minimal configuration - no ingress at all
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        adopt: true,
      });

      expect(tunnel).toMatchObject({
        tunnelId: expect.any(String),
        name: `${tunnelId}-test`,
      });

      // Should work fine without any ingress rules
      expect(tunnel.ingress).toBeUndefined();
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });

  test("DNS record creation and cleanup", async (scope) => {
    const api = await createCloudflareApi();
    const tunnelId = `${BRANCH_PREFIX}-dns-records`;
    let tunnel: Tunnel | undefined;

    try {
      // Create tunnel with multiple hostnames
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        ingress: [
          {
            hostname: `app1.${TEST_DOMAIN}`,
            service: "http://localhost:3001",
          },
          {
            hostname: `app2.${TEST_DOMAIN}`,
            service: "http://localhost:3002",
          },
          {
            hostname: `app3.${TEST_DOMAIN}`,
            service: "http://localhost:3003",
          },
          {
            service: "http_status:404",
          },
        ],
        adopt: true,
      });

      // Verify DNS records were created
      expect(tunnel.dnsRecords).toBeDefined();
      expect(Object.keys(tunnel.dnsRecords || {})).toHaveLength(3);
      expect(tunnel.dnsRecords).toHaveProperty(`app1.${TEST_DOMAIN}`);
      expect(tunnel.dnsRecords).toHaveProperty(`app2.${TEST_DOMAIN}`);
      expect(tunnel.dnsRecords).toHaveProperty(`app3.${TEST_DOMAIN}`);

      // Update tunnel to remove one hostname
      tunnel = await Tunnel(tunnelId, {
        name: `${tunnelId}-test`,
        ingress: [
          {
            hostname: `app1.${TEST_DOMAIN}`,
            service: "http://localhost:3001",
          },
          {
            hostname: `app3.${TEST_DOMAIN}`,
            service: "http://localhost:3003",
          },
          {
            service: "http_status:404",
          },
        ],
      });

      // Verify DNS records were updated
      expect(Object.keys(tunnel.dnsRecords || {})).toHaveLength(2);
      expect(tunnel.dnsRecords).toHaveProperty(`app1.${TEST_DOMAIN}`);
      expect(tunnel.dnsRecords).not.toHaveProperty(`app2.${TEST_DOMAIN}`);
      expect(tunnel.dnsRecords).toHaveProperty(`app3.${TEST_DOMAIN}`);
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertTunnelDeleted(api, tunnel?.tunnelId);
    }
  });
});

async function assertTunnelDeleted(api: CloudflareApi, tunnelId?: string) {
  if (tunnelId) {
    // we have to use list because getTunnel still returns data, but it won't be in list
    expect(
      (await listTunnels(api)).find((t) => t.id === tunnelId),
    ).toBeUndefined();
  }
}
