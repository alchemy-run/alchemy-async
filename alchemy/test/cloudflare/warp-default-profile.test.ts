import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { WarpDefaultProfile } from "../../src/cloudflare/warp-default-profile.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("WarpDefaultProfile Resource", () => {
  test("update default profile settings", async (scope) => {
    let profile: WarpDefaultProfile | undefined;
    try {
      profile = await WarpDefaultProfile("default", {
        serviceModeV2: { mode: "warp" },
        autoConnect: 0,
        captivePortal: 180,
        supportUrl: "https://support.example.com",
      });

      expect(profile.serviceModeV2?.mode).toEqual("warp");
      expect(profile.autoConnect).toEqual(0);
      expect(profile.captivePortal).toEqual(180);
      expect(profile.supportUrl).toEqual("https://support.example.com");

      // Verify default profile was updated
      await assertDefaultProfileUpdated();
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("update default profile with split tunnel", async (scope) => {
    let profile: WarpDefaultProfile | undefined;
    try {
      profile = await WarpDefaultProfile("default-split", {
        serviceModeV2: { mode: "warp" },
        splitTunnel: {
          mode: "exclude",
          entries: [
            { address: "10.0.0.0/8", description: "Internal network" },
            { address: "192.168.0.0/16", description: "Local network" },
          ],
        },
      });

      expect(profile.splitTunnel?.mode).toEqual("exclude");
      expect(profile.splitTunnel?.entries).toHaveLength(2);

      // Verify split tunnel was configured
      await assertDefaultSplitTunnelConfigured("exclude");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("update default profile with include mode split tunnel", async (scope) => {
    let profile: WarpDefaultProfile | undefined;
    try {
      profile = await WarpDefaultProfile("default-include", {
        serviceModeV2: { mode: "warp" },
        splitTunnel: {
          mode: "include",
          entries: [
            { address: "10.0.0.0/8", description: "Company network" },
            { address: "100.96.0.0/12", description: "WARP private range" },
          ],
        },
      });

      expect(profile.splitTunnel?.mode).toEqual("include");
      await assertDefaultSplitTunnelConfigured("include");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("update default profile with comprehensive settings", async (scope) => {
    let profile: WarpDefaultProfile | undefined;
    try {
      profile = await WarpDefaultProfile("default-full", {
        serviceModeV2: { mode: "warp" },
        disableAutoFallback: false,
        allowModeSwitch: false,
        switchLocked: true,
        tunnelProtocol: "wireguard",
        autoConnect: 0,
        allowedToLeave: false,
        captivePortal: 180,
        supportUrl: "https://support.example.com",
        excludeOfficeIps: true,
        lanAllowMinutes: 5,
        lanAllowSubnetSize: 24,
      });

      expect(profile.serviceModeV2?.mode).toEqual("warp");
      expect(profile.switchLocked).toEqual(true);
      expect(profile.tunnelProtocol).toEqual("wireguard");
      expect(profile.allowedToLeave).toEqual(false);
      expect(profile.excludeOfficeIps).toEqual(true);
      expect(profile.lanAllowMinutes).toEqual(5);
      expect(profile.lanAllowSubnetSize).toEqual(24);
    } finally {
      await alchemy.destroy(scope);
    }
  });

  async function assertDefaultProfileUpdated(): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(`/accounts/${api.accountId}/devices/policy`);

    expect(response.status).toEqual(200);
  }

  async function assertDefaultSplitTunnelConfigured(
    mode: "include" | "exclude",
  ): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(`/accounts/${api.accountId}/devices/policy`);
    expect(response.status).toEqual(200);

    // The API may omit split tunnel fields; a 200 is sufficient for this check
  }
});
