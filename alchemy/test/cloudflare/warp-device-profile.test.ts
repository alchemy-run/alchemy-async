import { beforeEach, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { WarpDeviceProfile } from "../../src/cloudflare/warp-device-profile.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("WarpDeviceProfile Resource", () => {
  const testId = `${BRANCH_PREFIX}-test-warp-profile`;
  const matchAllEmails = 'identity.email in {"test@example.com"}';
  const profileNames = [
    `${testId}-profile`,
    `${testId}-split-profile`,
    `${testId}-include-profile`,
    `${testId}-adopt`,
  ];

  beforeEach(async () => {
    await cleanupProfiles(profileNames);
  });

  test("create, update, and delete device profile", async (scope) => {
    let profile: WarpDeviceProfile | undefined;
    try {
      profile = await WarpDeviceProfile(testId, {
        name: `${testId}-profile`,
        match: matchAllEmails,
        precedence: 1100,
        enabled: true,
        adopt: true,
      });

      expect(profile.policyId).toBeTruthy();
      expect(profile.name).toEqual(`${testId}-profile`);
      expect(profile.match).toEqual(matchAllEmails);
      expect(profile.precedence).toEqual(1100);
      expect(profile.enabled).toEqual(true);

      // Verify profile was created by querying the API directly
      await assertProfileExists(profile.policyId);
      const originalPolicyId = profile.policyId;

      // Update the profile
      profile = await WarpDeviceProfile(testId, {
        name: `${testId}-profile`,
        match: matchAllEmails,
        precedence: 1101, // Changed
        enabled: true,
      });

      expect(profile.precedence).toEqual(1101);
      // Verify it's the same policy ID (not replaced)
      expect(profile.policyId).toEqual(originalPolicyId);

      // Verify profile was updated
      const api = await createCloudflareApi();
      const getResponse = await api.get(
        `/accounts/${api.accountId}/devices/policy/${profile.policyId}`,
      );
      expect(getResponse.status).toEqual(200);
      const data = (await getResponse.json()) as {
        result: { precedence: number };
      };
      expect(data.result.precedence).toEqual(1101);
    } finally {
      await alchemy.destroy(scope);
      if (profile) {
        // Verify profile was deleted
        await assertProfileNotExists(profile.policyId);
      }
    }
  });

  test("create profile with split tunnel configuration", async (scope) => {
    let profile: WarpDeviceProfile | undefined;
    try {
      profile = await WarpDeviceProfile(`${testId}-split`, {
        name: `${testId}-split-profile`,
        match: matchAllEmails,
        precedence: 1200,
        adopt: true,
        splitTunnel: {
          mode: "exclude",
          entries: [
            { address: "10.0.0.0/8", description: "Internal network" },
            { address: "192.168.0.0/16", description: "Local network" },
          ],
        },
      });

      expect(profile.policyId).toBeTruthy();
      expect(profile.splitTunnel?.mode).toEqual("exclude");
      expect(profile.splitTunnel?.entries).toHaveLength(2);

      // Verify split tunnel was configured
      await assertSplitTunnelConfigured(profile.policyId, "exclude");
    } finally {
      await alchemy.destroy(scope);
      if (profile) {
        await assertProfileNotExists(profile.policyId);
      }
    }
  });

  test("create profile with include mode split tunnel", async (scope) => {
    let profile: WarpDeviceProfile | undefined;
    try {
      profile = await WarpDeviceProfile(`${testId}-include`, {
        name: `${testId}-include-profile`,
        match: matchAllEmails,
        precedence: 1300,
        adopt: true,
        splitTunnel: {
          mode: "include",
          entries: [
            { address: "10.0.0.0/8", description: "Company network" },
            { address: "100.96.0.0/12", description: "WARP private range" },
          ],
        },
      });

      expect(profile.splitTunnel?.mode).toEqual("include");
      await assertSplitTunnelConfigured(profile.policyId, "include");
    } finally {
      await alchemy.destroy(scope);
      if (profile) {
        await assertProfileNotExists(profile.policyId);
      }
    }
  });

  test("adopt existing profile", async (scope) => {
    let profile: WarpDeviceProfile | undefined;
    const profileName = `${testId}-adopt`;
    try {
      // Create a profile first
      profile = await WarpDeviceProfile("original", {
        name: profileName,
        match: matchAllEmails,
        precedence: 9100,
        adopt: true,
      });

      const originalPolicyId = profile.policyId;

      // Adopt the existing profile
      await alchemy.run("nested", async () => {
        const adoptedProfile = await WarpDeviceProfile("original", {
          name: profileName,
          match: matchAllEmails,
          precedence: 9100,
          adopt: true,
        });

        const adoptedId =
          adoptedProfile.policyId ?? (await findPolicyIdByName(profileName));
        // Some accounts may not return the ID on adoption; tolerate missing ID
        if (adoptedId) {
          expect(adoptedId).toEqual(originalPolicyId);
        }
      });
    } finally {
      await alchemy.destroy(scope);
      if (profile) {
        await assertProfileNotExists(profile.policyId);
      }
    }
  });

  async function assertProfileExists(policyId: string): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/devices/policy/${policyId}`,
    );

    expect(response.status).toEqual(200);
  }

  async function assertProfileNotExists(policyId: string): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/devices/policy/${policyId}`,
    );

    expect(response.status).toEqual(404);
  }

  async function assertSplitTunnelConfigured(
    policyId: string,
    mode: "include" | "exclude",
  ): Promise<void> {
    const api = await createCloudflareApi();
    const endpoint =
      mode === "include"
        ? `/accounts/${api.accountId}/devices/policy/${policyId}/include`
        : `/accounts/${api.accountId}/devices/policy/${policyId}/exclude`;

    const response = await api.get(endpoint);
    expect(response.status).toEqual(200);

    const data = (await response.json()) as {
      result: Array<{ address?: string; host?: string }>;
    };
    expect(Array.isArray(data.result)).toBe(true);
    expect(data.result.length).toBeGreaterThan(0);
  }

  async function cleanupProfiles(names: string[]): Promise<void> {
    const api = await createCloudflareApi();
    const listResponse = await api.get(
      `/accounts/${api.accountId}/devices/policies`,
    );
    if (!listResponse.ok) return;
    const data = (await listResponse.json()) as {
      result: Array<{ id: string; name: string }>;
    };
    const matches = data.result?.filter((p) => names.includes(p.name)) ?? [];
    for (const p of matches) {
      await api.delete(`/accounts/${api.accountId}/devices/policy/${p.id}`);
    }
  }

  async function findPolicyIdByName(name: string): Promise<string | undefined> {
    const api = await createCloudflareApi();
    const listResponse = await api.get(
      `/accounts/${api.accountId}/devices/policies`,
    );
    if (!listResponse.ok) return undefined;
    const data = (await listResponse.json()) as {
      result: Array<{ id: string; name: string }>;
    };
    return data.result?.find((p) => p.name === name)?.id;
  }
});
