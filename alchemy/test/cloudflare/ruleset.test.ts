import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  type CloudflareApi,
  createCloudflareApi,
} from "../../src/cloudflare/api.ts";
import { getRuleset, Ruleset } from "../../src/cloudflare/ruleset.ts";
import { BRANCH_PREFIX } from "../util.ts";

import type { RulePhase } from "../../src/cloudflare/rule.ts";
import { findZoneForHostname } from "../../src/cloudflare/zone.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";

const api = await createCloudflareApi();
const test = alchemy.test(import.meta, { prefix: BRANCH_PREFIX });

const ZONE_NAME = process.env.TEST_ZONE ?? process.env.ALCHEMY_TEST_DOMAIN!;

const zoneId = (await findZoneForHostname(api, ZONE_NAME)).zoneId;

describe.skipIf(!process.env.ALL_TESTS)("Ruleset (http_ratelimit)", () => {
  test("create, update, and delete http_ratelimit ruleset", async (scope) => {
    try {
      // Create a simple rate limit that matches all requests
      await Ruleset(`${BRANCH_PREFIX}-ratelimit-basic`, {
        zone: ZONE_NAME,
        phase: "http_ratelimit",
        description: "Minimal rate limit",
        rules: [
          {
            description: "Minimal rate limit",
            expression: '(http.request.uri.path wildcard r"/content/*")',
            action: "block",
            ratelimit: {
              characteristics: ["ip.src", "cf.colo.id"],
              period: 10,
              requests_per_period: 3,
              mitigation_timeout: 10,
            },
          },
        ],
      });

      expect(await getRuleset(api, zoneId, "http_ratelimit")).toMatchObject({
        description: "Minimal rate limit",
        id: expect.any(String),
        kind: "zone",
        last_updated: expect.any(String),
        name: "default",
        phase: "http_ratelimit",
        rules: [
          {
            action: "block",
            description: "Minimal rate limit",
            enabled: true,
            expression: '(http.request.uri.path wildcard r"/content/*")',
            id: expect.any(String),
            last_updated: expect.any(String),
            ratelimit: {
              characteristics: ["ip.src", "cf.colo.id"],
              mitigation_timeout: 10,
              period: 10,
              requests_per_period: 3,
            },
            ref: expect.any(String),
            version: expect.any(String),
          },
        ],
        source: "rate_limit",
        version: expect.any(String),
      });

      await Ruleset(`${BRANCH_PREFIX}-ratelimit-basic`, {
        zone: ZONE_NAME,
        phase: "http_ratelimit",
        description: "Minimal rate limit",
        rules: [
          {
            description: "Minimal rate limit 2", // change the rule description
            expression: '(http.request.uri.path wildcard r"/content/*")',
            action: "block",
            ratelimit: {
              characteristics: ["ip.src", "cf.colo.id"],
              period: 10,
              requests_per_period: 3,
              mitigation_timeout: 10,
            },
          },
        ],
      });

      expect(await getRuleset(api, zoneId, "http_ratelimit")).toMatchObject({
        description: "Minimal rate limit",
        id: expect.any(String),
        kind: "zone",
        last_updated: expect.any(String),
        name: "default",
        phase: "http_ratelimit",
        rules: [
          {
            action: "block",
            description: "Minimal rate limit 2",
            enabled: true,
            expression: '(http.request.uri.path wildcard r"/content/*")',
            id: expect.any(String),
            last_updated: expect.any(String),
            ratelimit: {
              characteristics: ["ip.src", "cf.colo.id"],
              mitigation_timeout: 10,
              period: 10,
              requests_per_period: 3,
            },
            ref: expect.any(String),
            version: expect.any(String),
          },
        ],
        source: "rate_limit",
        version: expect.any(String),
      });
    } finally {
      await destroy(scope);
      await assertRulesetEmpty(api, zoneId, "http_ratelimit");
    }
  });

  test("create, update, and delete http_request_firewall_custom ruleset", async (scope) => {
    try {
      // Create a simple rate limit that matches all requests
      await Ruleset(`${BRANCH_PREFIX}-ratelimit-basic`, {
        zone: ZONE_NAME,
        phase: "http_request_firewall_custom",
        description: "Minimal rate limit",
        rules: [
          {
            description: "Block requests from ASN 123123",
            action: "block",
            expression: "(ip.src.asnum eq 123123)",
          },
        ],
      });

      expect(
        await getRuleset(api, zoneId, "http_request_firewall_custom"),
      ).toMatchObject({
        description: "Minimal rate limit",
        id: expect.any(String),
        phase: "http_request_firewall_custom",
        rules: [
          {
            action: "block",
            description: "Block requests from ASN 123123",
            expression: "(ip.src.asnum eq 123123)",
          },
        ],
      });

      await Ruleset(`${BRANCH_PREFIX}-ratelimit-basic`, {
        zone: ZONE_NAME,
        phase: "http_request_firewall_custom",
        description: "Minimal rate limit",
        rules: [
          {
            description: "Block requests from ASN 123123",
            action: "block",
            expression: "(ip.src.asnum eq 123123)",
          },
          {
            description: "Block requests from ASN 456456",
            action: "block",
            expression: "(ip.src.asnum eq 456456)",
          },
        ],
      });

      expect(
        await getRuleset(api, zoneId, "http_request_firewall_custom"),
      ).toMatchObject({
        description: "Minimal rate limit",
        id: expect.any(String),
        phase: "http_request_firewall_custom",
        rules: [
          {
            action: "block",
            description: "Block requests from ASN 123123",
            expression: "(ip.src.asnum eq 123123)",
          },
          {
            action: "block",
            description: "Block requests from ASN 456456",
            expression: "(ip.src.asnum eq 456456)",
          },
        ],
      });
    } finally {
      await destroy(scope);
      await assertRulesetEmpty(api, zoneId, "http_request_firewall_custom");
    }
  });
});

async function assertRulesetEmpty(
  api: CloudflareApi,
  zoneId: string,
  phase: RulePhase,
) {
  expect((await getRuleset(api, zoneId, phase)).rules).toBeUndefined();
}
