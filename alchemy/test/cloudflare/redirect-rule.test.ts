import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  type CloudflareApi,
  createCloudflareApi,
} from "../../src/cloudflare/api.ts";
import {
  RedirectRule,
  findRuleInRuleset,
} from "../../src/cloudflare/redirect-rule.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { Zone } from "../../src/cloudflare/zone.ts";
import { destroy } from "../../src/destroy.ts";
import { fetchAndExpectStatus } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const api = await createCloudflareApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
  quiet: false,
});
const testDomain = process.env.ALCHEMY_TEST_DOMAIN!;

const isEnabled = !!process.env.ALL_TESTS;

let zone: Zone;
test.beforeAll(async (_scope) => {
  if (!isEnabled) return;
  zone = await Zone(`${testDomain}-zone`, {
    name: testDomain,
    type: "full",
    jumpStart: false,
    delete: false,
  });
});

// this test relies on DNS prop and is therefore flaky
describe.skipIf(!isEnabled)("RedirectRule", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding test resources

  test("create, update, and delete redirect rule with expression", async (scope) => {
    let redirectRule: RedirectRule | undefined;

    await Worker("worker", {
      name: `${BRANCH_PREFIX}-wildcard-redirect`,
      domains: [testDomain],
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
        zone: zone.id,
        expression: `http.request.uri.path == "/old-page"`,
        targetUrl: `https://${testDomain}/new-page`,
        statusCode: 301,
        preserveQueryString: true,
      });
      console.log(redirectRule);

      expect(redirectRule).toMatchObject({
        zoneId: zone.id,
        expression: `http.request.uri.path == "/old-page"`,
        targetUrl: `https://${testDomain}/new-page`,
        statusCode: 301,
        preserveQueryString: true,
        enabled: true,
      });
      expect(redirectRule.ruleId).toBeTruthy();
      expect(redirectRule.rulesetId).toBeTruthy();

      // Verify the rule was created by checking it exists in the ruleset
      const rule = await findRuleInRuleset(
        api,
        zone.id,
        redirectRule.rulesetId,
        redirectRule.ruleId,
      );
      expect(rule).toBeTruthy();
      expect(rule!.action).toEqual("redirect");
      expect(rule!.enabled).toEqual(true);

      // Test actual redirect behavior
      // Note: This requires the domain to be properly configured with Cloudflare DNS
      await testRedirectBehavior(
        `https://${testDomain}/old-page`,
        `https://${testDomain}/new-page`,
        301,
        "Simple redirect",
      );

      // Update the redirect rule
      redirectRule = await RedirectRule(`${BRANCH_PREFIX}-wildcard-redirect`, {
        zone: zone.id,
        expression: `http.request.uri.path == "/old-page2"`,
        targetUrl: `https://${testDomain}/updated-page`,
        statusCode: 302,
        preserveQueryString: false,
      });

      expect(redirectRule).toMatchObject({
        statusCode: 302,
        preserveQueryString: false,
        expression: `http.request.uri.path == "/old-page2"`,
        targetUrl: `https://${testDomain}/updated-page`,
      });

      // Test updated redirect behavior
      await testRedirectBehavior(
        `https://legacy.${testDomain}/old-page2`,
        `https://${testDomain}/updated-page`,
        302,
        "Updated simple redirect",
      );
    } finally {
      await destroy(scope);
      if (redirectRule) {
        await assertRedirectRuleDoesNotExist(api, zone!.id, redirectRule);
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

/**
 * Test actual HTTP redirect behavior.
 *
 * NOTE: This function attempts to test real redirect behavior, but will gracefully
 * handle cases where domains don't resolve or aren't properly configured with Cloudflare.
 * For full redirect testing, the domains need to:
 * 1. Have proper DNS configuration pointing to Cloudflare
 * 2. Be proxied through Cloudflare (orange cloud enabled)
 * 3. Have SSL certificates configured
 *
 * @param sourceUrl - The URL that should trigger the redirect
 * @param expectedTargetUrl - The URL that should be redirected to
 * @param expectedStatus - The expected HTTP status code (301, 302, etc.)
 * @param testDescription - Description of the test for logging
 */
async function testRedirectBehavior(
  sourceUrl: string,
  expectedTargetUrl: string,
  expectedStatus: number,
  testDescription: string,
): Promise<void> {
  console.log(
    `Testing ${testDescription}: ${sourceUrl} -> ${expectedTargetUrl}`,
  );

  // Test the redirect with manual redirect handling to capture the redirect response
  const response = await fetchAndExpectStatus(
    sourceUrl,
    {
      redirect: "manual", // Don't follow redirects automatically
      headers: {
        "User-Agent": "alchemy-test-bot/1.0",
      },
    },
    expectedStatus,
    100,
    120_000,
  );

  // For redirect status codes, verify the Location header
  if (expectedStatus >= 300 && expectedStatus < 400) {
    const locationHeader = response.headers.get("location");
    if (locationHeader) {
      // Normalize URLs for comparison (handle relative vs absolute URLs)
      const actualTarget = new URL(locationHeader, sourceUrl).toString();
      const normalizedExpected = new URL(expectedTargetUrl).toString();

      expect(actualTarget).toEqual(normalizedExpected);
      console.log(`✓ ${testDescription}: Redirect Location header correct`);
    } else {
      console.warn(`⚠ ${testDescription}: Expected Location header not found`);
    }
  }
}
