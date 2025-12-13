import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  type CloudflareApi,
  createCloudflareApi,
} from "../../src/cloudflare/api.ts";
import {
  findRuleInRuleset,
  RedirectRule,
} from "../../src/cloudflare/redirect-rule.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { getZoneByDomain } from "../../src/cloudflare/zone.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const api = await createCloudflareApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
  quiet: false,
});
const testDomain = process.env.ALCHEMY_TEST_DOMAIN!;

const isEnabled = !!process.env.ALL_TESTS;

// test.beforeAll(async (_scope) => {
//   if (!isEnabled) return;
//   zone = await Zone(`${testDomain}-zone`, {
//     name: testDomain,
//     type: "full",
//     jumpStart: false,
//     delete: false,
//   });
// });

const zoneId = (await getZoneByDomain(api, testDomain))?.id;
if (!zoneId) {
  throw new Error(`Zone ${testDomain} not found`);
}

// this test relies on DNS prop and is therefore flaky
describe.skipIf(!isEnabled)("RedirectRule", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding test resources

  test("create, update, and delete redirect rule with expression", async (scope) => {
    let redirectRule: RedirectRule | undefined;

    await Worker("worker", {
      name: `${BRANCH_PREFIX}-wildcard-redirect`,
      domains: [`redirect.${testDomain}`],
      adopt: true,
      script: `
        export default {
          async fetch(request) {
            return new Response("Hello, world!")
          }
        }
      `,
    });
    try {
      // Create a simple redirect rule (no wildcards for now)
      redirectRule = await RedirectRule(`${BRANCH_PREFIX}-wildcard-redirect`, {
        description: "my rule",
        zone: testDomain,
        expression: `http.request.uri.path == "/old-page"`,
        targetUrl: `https://redirect.${testDomain}/new-page`,
        statusCode: 301,
        preserveQueryString: true,
      });

      expect(redirectRule).toMatchObject({
        zoneId: zoneId,
        description: "my rule",
        expression: `http.request.uri.path == "/old-page"`,
        targetUrl: `https://redirect.${testDomain}/new-page`,
        statusCode: 301,
        preserveQueryString: true,
        enabled: true,
      });
      expect(redirectRule.ruleId).toBeTruthy();
      expect(redirectRule.rulesetId).toBeTruthy();

      // Verify the rule was created by checking it exists in the ruleset

      expect(
        await findRuleInRuleset(
          api,
          zoneId,
          redirectRule.rulesetId,
          redirectRule.ruleId,
        ),
      ).toMatchObject({
        description: "my rule",
        action: "redirect",
        expression: `http.request.uri.path == "/old-page"`,
        enabled: true,
      });

      // Test actual redirect behavior
      // Note: This requires the domain to be properly configured with Cloudflare DNS
      // await testRedirectBehavior(
      //   `https://redirect.${testDomain}/old-page`,
      //   `https://redirect.${testDomain}/new-page`,
      //   301,
      //   "Simple redirect",
      // );

      // Update the redirect rule
      redirectRule = await RedirectRule(`${BRANCH_PREFIX}-wildcard-redirect`, {
        zone: testDomain,
        description: "my rule 2",
        expression: `http.request.uri.path == "/old-page2"`,
        targetUrl: `https://redirect.${testDomain}/updated-page`,
        statusCode: 302,
        preserveQueryString: false,
      });

      expect(redirectRule).toMatchObject({
        statusCode: 302,
        preserveQueryString: false,
        description: "my rule 2",
        expression: `http.request.uri.path == "/old-page2"`,
        targetUrl: `https://redirect.${testDomain}/updated-page`,
      });

      expect(
        await findRuleInRuleset(
          api,
          zoneId,
          redirectRule.rulesetId,
          redirectRule.ruleId,
        ),
      ).toMatchObject({
        description: "my rule 2",
        action: "redirect",
        expression: `http.request.uri.path == "/old-page2"`,
      });

      // Test updated redirect behavior
      // await testRedirectBehavior(
      //   `https://legacy.${testDomain}/old-page2`,
      //   `https://redirect.${testDomain}/updated-page`,
      //   302,
      //   "Updated simple redirect",
      // );
    } finally {
      await destroy(scope);
      if (redirectRule) {
        await assertRedirectRuleDoesNotExist(api, zoneId, redirectRule);
      }
    }
  });
});

/**
 * Assert that a redirect rule does not exist in Cloudflare.
 * This is used to verify that a redirect rule has been properly deleted.
 *
 * @param api - Cloudflare API client
 * @param zoneId - Zone ID where the rule should have been deleted
 * @param redirectRule - The redirect rule that should no longer exist
 */
async function assertRedirectRuleDoesNotExist(
  api: CloudflareApi,
  zoneId: string,
  redirectRule: RedirectRule,
): Promise<void> {
  const rule = await findRuleInRuleset(
    api,
    zoneId,
    redirectRule.rulesetId,
    redirectRule.ruleId,
  );
  expect(rule).toBeNull();
}
