import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  type CloudflareApi,
  createCloudflareApi,
} from "../../src/cloudflare/api.ts";
import { Tunnel, getTunnel } from "../../src/cloudflare/tunnel.ts";
import {
  TunnelRoute,
  getTunnelRoute,
  listTunnelRoutes,
} from "../../src/cloudflare/tunnel-route.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX, waitFor } from "../util.ts";
// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("TunnelRoute Resource", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-route`;

  test("create, update, and delete tunnel route", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: any;
    let route: any;

    try {
      // Create a tunnel first (required for route)
      tunnel = await Tunnel(`${testId}-tunnel`, {
        name: `${testId}-tunnel`,
        adopt: true,
      });

      // Create a route with basic configuration
      // Use a deterministic but valid CIDR based on test ID hash
      const networkSuffix =
        Math.abs(
          testId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
        ) % 255;
      const network = `10.${networkSuffix}.0.0/24`;

      route = await TunnelRoute(testId, {
        network: network,
        tunnel: tunnel,
        comment: "Test route for tunnel",
      });

      // Verify route was created
      expect(route).toMatchObject({
        id: expect.any(String),
        network: network,
        tunnelId: tunnel.tunnelId,
        comment: "Test route for tunnel",
        createdAt: expect.any(String),
        deletedAt: null,
        type: "cloudflare::TunnelRoute",
      });

      // Verify route exists via API
      const apiRoute = await getTunnelRoute(api, route.id);
      expect(apiRoute).toMatchObject({
        id: route.id,
        network: network,
        tunnel_id: tunnel.tunnelId,
        comment: "Test route for tunnel",
      });

      // Update the route with new comment
      route = await TunnelRoute(testId, {
        network: network,
        tunnel: tunnel,
        comment: "Updated test route comment",
      });

      // Verify route was updated
      expect(route).toMatchObject({
        id: route.id, // ID should remain the same
        network: network,
        tunnelId: tunnel.tunnelId,
        comment: "Updated test route comment",
      });

      // Verify updated route via API
      const updatedApiRoute = await getTunnelRoute(api, route.id);
      expect(updatedApiRoute).toMatchObject({
        id: route.id,
        comment: "Updated test route comment",
      });
    } catch (err) {
      // Log the error or else it's silently swallowed by destroy errors
      console.error("Test error:", err);
      throw err;
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      // Verify route was deleted
      await assertRouteDeleted(api, route?.id);
    }
  });

  test("create route with tunnel ID string", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: any;
    let route: any;

    try {
      // Create a tunnel first
      tunnel = await Tunnel(`${testId}-tunnel-string`, {
        name: `${testId}-tunnel-string`,
        adopt: true,
      });

      // Create a route using tunnel ID as string
      const networkSuffix2 =
        Math.abs(
          `${testId}-string`
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0),
        ) % 255;
      const network2 = `172.${networkSuffix2}.0.0/24`;

      route = await TunnelRoute(`${testId}-string`, {
        network: network2,
        tunnel: tunnel.tunnelId, // Pass tunnel ID as string
        comment: "Route with string tunnel ID",
      });

      // Verify route was created
      expect(route).toMatchObject({
        id: expect.any(String),
        network: network2,
        tunnelId: tunnel.tunnelId,
        comment: "Route with string tunnel ID",
      });

      // Verify route exists via API
      const apiRoute = await getTunnelRoute(api, route.id);
      expect(apiRoute.tunnel_id).toBe(tunnel.tunnelId);
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertRouteDeleted(api, route?.id);
    }
  });

  test("network immutability triggers replacement", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: any;
    let route: any;

    try {
      // Create a tunnel first
      tunnel = await Tunnel(`${testId}-tunnel-immutable`, {
        name: `${testId}-tunnel-immutable`,
        adopt: true,
      });

      // Create initial route
      const networkSuffix3 =
        Math.abs(
          `${testId}-immutable`
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0),
        ) % 255;
      const network3 = `192.${networkSuffix3}.0.0/24`;

      route = await TunnelRoute(`${testId}-immutable`, {
        network: network3,
        tunnel: tunnel,
      });

      const originalId = route.id;

      // Try to change network (should trigger replacement)
      const network4 = `192.${(networkSuffix3 + 1) % 255}.0.0/24`; // Different network
      route = await TunnelRoute(`${testId}-immutable`, {
        network: network4,
        tunnel: tunnel,
      });

      // The route should have been replaced (new ID)
      expect(route.id).not.toBe(originalId);
      expect(route.network).toBe(network4);

      // Verify old route was deleted
      const oldRouteResponse = await api.get(
        `/accounts/${api.accountId}/teamnet/routes/${originalId}`,
      );
      if (oldRouteResponse.ok) {
        const oldRoute = (
          (await oldRouteResponse.json()) as {
            result: { deleted_at: string | null };
          }
        ).result;
        expect(oldRoute.deleted_at).not.toBeNull();
      } else {
        expect(oldRouteResponse.status).toBe(404);
      }
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertRouteDeleted(api, route?.id);
    }
  });

  test("adopt existing route", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: any;
    let route: any;

    try {
      // Create a tunnel first
      tunnel = await Tunnel(`${testId}-tunnel-adopt`, {
        name: `${testId}-tunnel-adopt`,
        adopt: true,
      });

      // Create a route manually via API first
      const networkSuffix4 =
        Math.abs(
          `${testId}-adopt`
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0),
        ) % 255;
      const network5 = `10.${networkSuffix4}.2.0/24`;

      const createResponse = await api.post(
        `/accounts/${api.accountId}/teamnet/routes`,
        {
          network: network5,
          tunnel_id: tunnel.tunnelId,
          comment: "Pre-existing route",
        },
      );

      if (!createResponse.ok) {
        throw new Error(
          `Failed to create route for adoption test: ${createResponse.statusText}`,
        );
      }

      const existingRoute = (
        (await createResponse.json()) as { result: { id: string } }
      ).result;

      // Now adopt it
      route = await TunnelRoute(`${testId}-adopt`, {
        network: network5,
        tunnel: tunnel,
        adopt: true,
        comment: "Adopted route with updated comment",
      });

      // Verify route was adopted (same ID)
      expect(route.id).toBe(existingRoute.id);
      expect(route.comment).toBe("Adopted route with updated comment");
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertRouteDeleted(api, route?.id);
    }
  });

  test("delete false keeps route", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: any;
    let route: any;
    const uniqueSuffix = Date.now().toString();
    const tunnelResourceId = `${testId}-tunnel-no-delete-${uniqueSuffix}`;
    const routeResourceId = `${testId}-no-delete-${uniqueSuffix}`;

    try {
      // Create a tunnel first
      tunnel = await Tunnel(tunnelResourceId, {
        name: tunnelResourceId,
        adopt: true,
      });

      // Ensure tunnel exists before creating route (Cloudflare can be eventual)
      await waitFor(
        async () => await getTunnel(api, tunnel.tunnelId),
        () => true,
        { timeoutMs: 5_000, intervalMs: 250 },
      );

      // Create a route with delete: false
      // Use a unique network suffix to avoid conflicts
      const networkSuffix5 =
        Math.abs(
          routeResourceId
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0),
        ) % 255;
      const network6 = `10.${networkSuffix5}.4.0/24`; // Use .4 instead of .3 to avoid conflicts

      route = await TunnelRoute(routeResourceId, {
        network: network6,
        tunnel: tunnel,
        delete: false,
        adopt: true, // Adopt if it already exists
      });

      const routeId = route.id;

      // Verify route exists before destroy
      let routeResponse = await api.get(
        `/accounts/${api.accountId}/teamnet/routes/${routeId}`,
      );
      expect(routeResponse.ok).toBe(true);
      let routeData = (
        (await routeResponse.json()) as {
          result: { deleted_at: string | null };
        }
      ).result;
      expect(routeData.deleted_at).toBeNull();

      // Destroy scope (should not delete route since delete: false)
      // But we need to catch the tunnel deletion error since routes prevent tunnel deletion
      try {
        await destroy(scope);
      } catch (err: any) {
        // Expected: tunnel can't be deleted while routes exist
        if (err.message?.includes("Warp routing configured")) {
          // This is expected - we need to delete route first
        } else {
          throw err;
        }
      }

      // Verify route still exists (not deleted by destroy due to delete: false)
      routeResponse = await api.get(
        `/accounts/${api.accountId}/teamnet/routes/${routeId}`,
      );
      expect(routeResponse.ok).toBe(true);
      routeData = (
        (await routeResponse.json()) as {
          result: { deleted_at: string | null };
        }
      ).result;
      expect(routeData.deleted_at).toBeNull(); // Should not be deleted

      // Clean up manually - delete route first, then tunnel can be deleted
      await api
        .delete(`/accounts/${api.accountId}/teamnet/routes/${routeId}`)
        .catch(() => {
          // Ignore if already deleted
        });

      // Manually delete tunnel since destroy failed due to routes
      try {
        await api
          .delete(`/accounts/${api.accountId}/cfd_tunnel/${tunnel.tunnelId}`)
          .catch(() => {
            // Ignore if already deleted
          });
      } catch (err) {
        // Ignore cleanup errors
      }
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    }
  });

  test("route is attached to tunnel", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: any;
    let route: any;

    try {
      // Create a tunnel
      tunnel = await Tunnel(`${testId}-attach-tunnel`, {
        name: `${testId}-attach-tunnel`,
        adopt: true,
      });

      // Create a route for that tunnel
      const networkSuffix =
        Math.abs(
          `${testId}-attach`
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0),
        ) % 255;
      const network = `10.${networkSuffix}.5.0/24`;

      route = await TunnelRoute(`${testId}-attach`, {
        network,
        tunnel,
        comment: "Route should attach to tunnel",
      });

      // Fetch via API and confirm the route points to the tunnel
      const apiRoute = await getTunnelRoute(api, route.id);
      expect(apiRoute.tunnel_id).toBe(tunnel.tunnelId);
      expect(apiRoute.network).toBe(network);

      // Cross-check using the helper finder
      const routes = await listTunnelRoutes(api, { limit: 50 });
      const match = routes.find(
        (r) =>
          r.id === route.id &&
          r.tunnel_id === tunnel.tunnelId &&
          r.network === network,
      );
      expect(match).toBeDefined();
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertRouteDeleted(api, route?.id);
    }
  });
});

async function assertRouteDeleted(api: CloudflareApi, routeId?: string) {
  if (routeId) {
    const response = await api.get(
      `/accounts/${api.accountId}/teamnet/routes/${routeId}`,
    );
    // Routes may return 200 even when deleted (soft delete), so check deleted_at
    if (response.ok) {
      const route = (
        (await response.json()) as { result: { deleted_at: string | null } }
      ).result;
      expect(route.deleted_at).not.toBeNull();
    } else {
      expect(response.status).toBe(404);
    }
  }
}
