import { CloudflareEnvironment } from "@/Cloudflare/CloudflareEnvironment";
import * as Cloudflare from "@/Cloudflare/index.ts";
import {
  WorkerVersionConfigError,
  workerAffinityRulePrefix,
} from "@/Cloudflare/Workers/WorkerProvider.ts";
import { findZoneByName } from "@/Cloudflare/Zone/lookup";
import * as Test from "@/Test/Alchemy";
import * as rulesets from "@distilled.cloud/cloudflare/rulesets";
import { describe, expect } from "alchemy-test";
import * as Effect from "effect/Effect";
import { MinimumLogLevel } from "effect/References";
import * as Schedule from "effect/Schedule";

const { test } = Test.make({ providers: Cloudflare.providers() });

const logLevel = Effect.provideService(
  MinimumLogLevel,
  process.env.DEBUG ? "Debug" : "Info",
);

const zoneName =
  process.env.CLOUDFLARE_TEST_WORKER_DOMAIN_ZONE_NAME ??
  process.env.CLOUDFLARE_TEST_DNS_ZONE_NAME ??
  "alchemy-test-2.us";

// Deterministic per-run hostnames on the standing test zone. Each rerun
// reuses the same hostnames (never derive names from Date.now()).
const domainSuffix = `alchemy-worker-affinity-${process.env.PULL_REQUEST ?? process.env.USER}`;

const ROLLOUT_HOSTNAME = `wva1-${domainSuffix}.${zoneName}`;
const CANARY_HOSTNAME = `wva2-${domainSuffix}.${zoneName}`;

const script = (marker: string) =>
  `export default { fetch() { return new Response("${marker}"); } };`;

const resolveZoneId = Effect.gen(function* () {
  const { accountId } = yield* yield* CloudflareEnvironment;
  const zone = yield* findZoneByName({ accountId, name: zoneName });
  if (!zone) {
    return yield* Effect.die(
      new Error(`zone "${zoneName}" not found in account`),
    );
  }
  return zone.id;
});

/**
 * The affinity rules a script currently owns in the zone's
 * `http_request_late_transform` phase entrypoint — the out-of-band
 * verification for everything this suite asserts. Retries rate-limit and
 * token-propagation blips on the test's own reads.
 */
const affinityRules = (zoneId: string, scriptName: string) =>
  rulesets
    .getPhasForZone({ zoneId, rulesetPhase: "http_request_late_transform" })
    .pipe(
      Effect.map((entrypoint) =>
        (entrypoint.rules ?? []).filter((rule) =>
          (rule.description ?? "").startsWith(
            workerAffinityRulePrefix(scriptName),
          ),
        ),
      ),
      Effect.catchTag("RulesetNotFound", () => Effect.succeed([])),
      Effect.retry({
        while: (e) => e._tag === "TooManyRequests" || e._tag === "Forbidden",
        schedule: Schedule.exponential("500 millis"),
        times: 8,
      }),
    );

const versionKeyExpression = (rule: { actionParameters?: unknown }) =>
  (
    rule.actionParameters as
      | {
          headers?: Record<
            string,
            { operation?: string; expression?: string } | undefined
          >;
        }
      | undefined
  )?.headers?.["Cloudflare-Workers-Version-Key"]?.expression;

// The shared phase entrypoint is a zone-wide read-modify-write surface, so
// these tests run sequentially (no describe.concurrent).
describe("Cloudflare.Worker version affinity", () => {
  test.provider.skipIf(!zoneName)(
    "self-rollout affinity: provision, converge source change, remove, destroy",
    (stack) =>
      Effect.gen(function* () {
        const zoneId = yield* resolveZoneId;

        yield* stack.destroy();

        // Create — a rollout with cookie affinity falling back to IP.
        const v1 = yield* stack.deploy(
          Effect.gen(function* () {
            return yield* Cloudflare.Worker("AffinityWorker", {
              script: script("affinity-v1"),
              workersDev: false,
              domain: ROLLOUT_HOSTNAME,
              version: {
                traffic: 50,
                affinity: { cookie: "session_id", fallback: "ip" },
              },
            });
          }),
        );

        expect(v1.affinityZoneIds).toEqual([zoneId]);
        const cookieRules = yield* affinityRules(zoneId, v1.workerName);
        expect(cookieRules).toHaveLength(2);
        const prefix = workerAffinityRulePrefix(v1.workerName);
        const primary = cookieRules.find((r) => r.description === prefix);
        const fallback = cookieRules.find(
          (r) => r.description === `${prefix}:fallback`,
        );
        expect(primary?.expression).toEqual(
          `http.host eq "${ROLLOUT_HOSTNAME}" and len(http.request.cookies["session_id"]) > 0`,
        );
        expect(versionKeyExpression(primary!)).toEqual(
          'http.request.cookies["session_id"][0]',
        );
        expect(fallback?.expression).toEqual(
          `http.host eq "${ROLLOUT_HOSTNAME}" and len(http.request.cookies["session_id"]) == 0`,
        );
        expect(versionKeyExpression(fallback!)).toEqual("to_string(ip.src)");

        // Update — switching the source converges the rule set in place
        // (cookie pair out, single header rule in).
        const v2 = yield* stack.deploy(
          Effect.gen(function* () {
            return yield* Cloudflare.Worker("AffinityWorker", {
              script: script("affinity-v2"),
              workersDev: false,
              domain: ROLLOUT_HOSTNAME,
              version: {
                traffic: 50,
                affinity: { header: "X-Session-Id" },
              },
            });
          }),
        );

        expect(v2.affinityZoneIds).toEqual([zoneId]);
        const headerRules = yield* affinityRules(zoneId, v2.workerName);
        expect(headerRules).toHaveLength(1);
        expect(headerRules[0].expression).toEqual(
          `http.host eq "${ROLLOUT_HOSTNAME}" and len(http.request.headers["x-session-id"]) > 0`,
        );
        expect(versionKeyExpression(headerRules[0])).toEqual(
          'http.request.headers["x-session-id"][0]',
        );

        // Update — removing affinity (while keeping the rollout) cleans our
        // rules out of the shared entrypoint.
        const v3 = yield* stack.deploy(
          Effect.gen(function* () {
            return yield* Cloudflare.Worker("AffinityWorker", {
              script: script("affinity-v3"),
              workersDev: false,
              domain: ROLLOUT_HOSTNAME,
              version: { traffic: 50 },
            });
          }),
        );

        expect(v3.affinityZoneIds).toBeUndefined();
        expect(yield* affinityRules(zoneId, v3.workerName)).toHaveLength(0);

        // Re-add (the "ip" shorthand), then destroy — the rules must not
        // outlive the Worker.
        const v4 = yield* stack.deploy(
          Effect.gen(function* () {
            return yield* Cloudflare.Worker("AffinityWorker", {
              script: script("affinity-v4"),
              workersDev: false,
              domain: ROLLOUT_HOSTNAME,
              version: { traffic: 50, affinity: "ip" },
            });
          }),
        );
        expect(v4.affinityZoneIds).toEqual([zoneId]);
        const ipRules = yield* affinityRules(zoneId, v4.workerName);
        expect(ipRules).toHaveLength(1);
        expect(versionKeyExpression(ipRules[0])).toEqual("to_string(ip.src)");

        yield* stack.destroy();
        expect(yield* affinityRules(zoneId, v4.workerName)).toHaveLength(0);
      }).pipe(logLevel),
    { timeout: 420_000 },
  );

  test.provider.skipIf(!zoneName)(
    "canary affinity lands on the parent's zone and releases with the canary",
    (stack) =>
      Effect.gen(function* () {
        const zoneId = yield* resolveZoneId;

        yield* stack.destroy();

        // Parent serves from a custom domain; the canary carries the
        // affinity declaration.
        const v1 = yield* stack.deploy(
          Effect.gen(function* () {
            const parent = yield* Cloudflare.Worker("AffinityParent", {
              script: script("affinity-parent-v1"),
              workersDev: false,
              domain: CANARY_HOSTNAME,
            });
            const canary = yield* Cloudflare.Worker("AffinityCanary", {
              script: script("affinity-canary-v1"),
              version: {
                parent,
                traffic: 25,
                affinity: { cookie: "uid" },
              },
            });
            return { parent, canary };
          }),
        );

        // The rules are tagged with the *parent's* script — that's whose
        // traffic is being split.
        expect(v1.canary.affinityZoneIds).toEqual([zoneId]);
        const canaryRules = yield* affinityRules(zoneId, v1.parent.workerName);
        expect(canaryRules).toHaveLength(1);
        expect(canaryRules[0].expression).toEqual(
          `http.host eq "${CANARY_HOSTNAME}" and len(http.request.cookies["uid"]) > 0`,
        );

        // Releasing the canary removes the rules; the parent's own zone
        // surface is untouched.
        const v2 = yield* stack.deploy(
          Effect.gen(function* () {
            const parent = yield* Cloudflare.Worker("AffinityParent", {
              script: script("affinity-parent-v1"),
              workersDev: false,
              domain: CANARY_HOSTNAME,
            });
            return { parent };
          }),
        );

        expect(yield* affinityRules(zoneId, v2.parent.workerName)).toHaveLength(
          0,
        );
        expect(v2.parent.domain?.name).toEqual(CANARY_HOSTNAME);

        yield* stack.destroy();
      }).pipe(logLevel),
    { timeout: 420_000 },
  );

  test.provider(
    "affinity on a workers.dev-only Worker is a typed config error",
    (stack) =>
      Effect.gen(function* () {
        yield* stack.destroy();

        const error = yield* stack
          .deploy(
            Effect.gen(function* () {
              return yield* Cloudflare.Worker("AffinityNoZone", {
                script: script("affinity-nozone-v1"),
                version: { traffic: 50, affinity: { cookie: "session_id" } },
              });
            }),
          )
          .pipe(Effect.flip);

        expect(error).toBeInstanceOf(WorkerVersionConfigError);
        expect(String(error)).toContain("workers.dev");

        yield* stack.destroy();
      }).pipe(logLevel),
    { timeout: 180_000 },
  );
});
