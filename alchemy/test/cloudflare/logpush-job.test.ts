import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { R2Bucket } from "../../src/cloudflare/bucket.ts";
import { LogPushJob } from "../../src/cloudflare/logpush-job.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { findZoneForHostname } from "../../src/cloudflare/zone.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const api = await createCloudflareApi();
const ZONE_NAME = "alchemy-test.us";
const zoneId = (await findZoneForHostname(api, ZONE_NAME)).zoneId;

/**
 * Create a Worker to receive LogPush data
 */
async function createLogReceiver(name: string) {
  return await Worker(name, {
    name,
    script: `
export default {
  async fetch(request) {
    return new Response('OK', { status: 200 });
  }
}`,
    url: true,
  });
}

describe.sequential("LogPushJob Resource Basic", () => {
  const testId = `${BRANCH_PREFIX}-logpush`;

  test("create, update, and delete zone-level LogPush job with string destination", async (scope) => {
    let logPushJob: LogPushJob | undefined;

    try {
      const logReceiver = await createLogReceiver(`logpush-receiver-${testId}`);

      const destination = `${logReceiver.url}/logs/${BRANCH_PREFIX}/{DATE}?header_X-Test=${encodeURIComponent(
        testId,
      )}`;

      logPushJob = await LogPushJob(testId, {
        zone: zoneId,
        dataset: "http_requests",
        destination,
        name: `test-logpush-${testId}`,
        enabled: false,
        outputOptions: {
          outputType: "ndjson",
          timestampFormat: "rfc3339",
          fieldNames: ["RayID", "ClientIP", "EdgeStartTimestamp"],
        },
      });

      expect(logPushJob.id).toBeTruthy();
      expect(logPushJob.dataset).toBe("http_requests");
      expect(logPushJob.type).toBe("logpush_job");
      expect(logPushJob.enabled).toBe(false);
      expect(logPushJob.accountId).toBe(api.accountId);
      expect(logPushJob.outputOptions?.outputType).toBe("ndjson");

      await assertLogPushJobExists(api, zoneId, logPushJob.id!);

      const response = await api.get(
        `/zones/${zoneId}/logpush/jobs/${logPushJob.id}`,
      );
      const data: any = await response.json();
      expect(data.result.dataset).toBe("http_requests");
      expect(data.result.name).toBe(`test-logpush-${testId}`);

      logPushJob = await LogPushJob(testId, {
        zone: zoneId,
        dataset: "http_requests",
        destination,
        name: `updated-${testId}`,
        enabled: false,
      });

      expect(logPushJob.enabled).toBe(false);
      expect(logPushJob.name).toBe(`updated-${testId}`);

      const updatedResponse = await api.get(
        `/zones/${zoneId}/logpush/jobs/${logPushJob.id}`,
      );
      const updatedData: any = await updatedResponse.json();
      expect(updatedData.result.enabled).toBe(false);
    } catch (err) {
      console.error("LogPush test error:", err);
      throw err;
    } finally {
      await destroy(scope);

      if (logPushJob?.id) {
        await assertLogPushJobDeleted(api, zoneId, logPushJob.id);
      }
    }
  }, 120000);

  test("create LogPush job with output options", async (scope) => {
    let logPushJob: LogPushJob | undefined;

    try {
      const logReceiver = await createLogReceiver(
        `logpush-receiver-${testId}-output`,
      );

      const destination = `${logReceiver.url}/logs/${BRANCH_PREFIX}-2/{DATE}?header_X-Test=${encodeURIComponent(
        `${testId}-output`,
      )}`;

      logPushJob = await LogPushJob(`${testId}-output`, {
        zone: zoneId,
        dataset: "http_requests",
        destination,
        name: `output-${testId}`,
        enabled: false,
        outputOptions: {
          outputType: "ndjson",
          timestampFormat: "rfc3339",
          fieldNames: ["ClientIP", "ClientRequestHost", "EdgeResponseStatus"],
        },
      });

      expect(logPushJob.outputOptions?.outputType).toBe("ndjson");

      const response = await api.get(
        `/zones/${zoneId}/logpush/jobs/${logPushJob.id}`,
      );
      const data: any = await response.json();
      expect(data.result.output_options.output_type).toBe("ndjson");
    } catch (err) {
      console.error("LogPush test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      if (logPushJob?.id) {
        await assertLogPushJobDeleted(api, zoneId, logPushJob.id);
      }
    }
  }, 120000);

  test("create LogPush job with filter and sampling", async (scope) => {
    let logPushJob: LogPushJob | undefined;

    try {
      const logReceiver = await createLogReceiver(
        `logpush-receiver-${testId}-filter`,
      );

      const destination = `${logReceiver.url}/logs/${BRANCH_PREFIX}-3/{DATE}?header_X-Test=${encodeURIComponent(
        `${testId}-filter`,
      )}`;
      const filter =
        '{"where":{"and":[{"key":"ClientCountry","operator":"neq","value":"ca"}]}}';

      logPushJob = await LogPushJob(`${testId}-filter`, {
        zone: zoneId,
        dataset: "http_requests",
        destination,
        name: `filter-${testId}`,
        enabled: false,
        outputOptions: {
          sampleRate: 0.5,
        },
        filter,
      });

      expect(logPushJob.filter).toBe(filter);
      expect(logPushJob.outputOptions?.sampleRate).toBe(0.5);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await api.get(
        `/zones/${zoneId}/logpush/jobs/${logPushJob.id}`,
      );
      const data: any = await response.json();
      expect(data.result.output_options.sample_rate).toBe(0.5);
    } catch (err) {
      console.error("LogPush test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      if (logPushJob?.id) {
        await assertLogPushJobDeleted(api, zoneId, logPushJob.id);
      }
    }
  }, 120000);

  test("create LogPush job with frequency and batch settings", async (scope) => {
    let logPushJob: LogPushJob | undefined;

    try {
      const logReceiver = await createLogReceiver(
        `logpush-receiver-${testId}-batch`,
      );

      const destination = `${logReceiver.url}/logs/${BRANCH_PREFIX}-4/{DATE}?header_X-Test=${encodeURIComponent(
        `${testId}-batch`,
      )}`;

      logPushJob = await LogPushJob(`${testId}-batch`, {
        zone: zoneId,
        dataset: "http_requests",
        destination,
        name: `batch-${testId}`,
        enabled: false,
        frequency: "low",
        maxUploadBytes: 5_000_000,
        maxUploadIntervalSeconds: 30,
        maxUploadRecords: 1000,
      });

      expect(logPushJob.frequency).toBe("low");
      expect(logPushJob.maxUploadBytes).toBe(5_000_000);

      const response = await api.get(
        `/zones/${zoneId}/logpush/jobs/${logPushJob.id}`,
      );
      const data: any = await response.json();
      expect(data.result.frequency).toBe("low");
      expect(data.result.max_upload_bytes).toBe(5_000_000);
    } catch (err) {
      console.error("LogPush test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      if (logPushJob?.id) {
        await assertLogPushJobDeleted(api, zoneId, logPushJob.id);
      }
    }
  }, 120000);

  test("delete=false prevents job deletion", async (scope) => {
    let logPushJob: LogPushJob | undefined;

    try {
      const logReceiver = await createLogReceiver(
        `logpush-receiver-${testId}-nodelete`,
      );

      const destination = `${logReceiver.url}/logs/${BRANCH_PREFIX}-5/{DATE}?header_X-Test=${encodeURIComponent(
        `${testId}-nodelete`,
      )}`;

      logPushJob = await LogPushJob(`${testId}-nodelete`, {
        zone: zoneId,
        dataset: "http_requests",
        destination,
        name: `nodelete-${testId}`,
        enabled: false,
        delete: false,
      });

      const jobId = logPushJob.id;

      await destroy(scope);
      await assertLogPushJobExists(api, zoneId, jobId!);
      await api.delete(`/zones/${zoneId}/logpush/jobs/${jobId}`);

      await assertLogPushJobDeleted(api, zoneId, jobId!);
    } catch (err) {
      console.error("LogPush test error:", err);
      throw err;
    } finally {
      if (logPushJob?.id) {
        try {
          await api.delete(`/zones/${zoneId}/logpush/jobs/${logPushJob.id}`);
        } catch {}
      }
    }
  }, 120000);

  test("create LogPush job with R2Bucket resource", async (scope) => {
    let logPushJob: LogPushJob | undefined;

    try {
      const bucket = await R2Bucket("logs-bucket", {
        name: `logpush-bucket-${BRANCH_PREFIX.toLowerCase()}`,
        adopt: true,
        empty: true,
      });

      logPushJob = await LogPushJob(`${testId}-r2-bucket`, {
        // zone: zoneId,
        dataset: "workers_trace_events",
        destination: bucket,
        name: `r2-bucket-${testId}`,
        enabled: false,
      });

      expect(logPushJob.id).toBeTruthy();
      expect(logPushJob.dataset).toBe("workers_trace_events");
      expect(logPushJob.type).toBe("logpush_job");

      const response = await api.get(
        `/accounts/${api.accountId}/logpush/jobs/${logPushJob.id}`,
      );
      const data: any = await response.json();
      expect(data.result.dataset).toBe("workers_trace_events");
    } catch (err) {
      console.error("LogPush test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      if (logPushJob?.id) {
        await assertLogPushJobDeleted(api, undefined, logPushJob.id);
      }
    }
  }, 120000);
});

/**
 * Verify logpush job exists via API (zone-scoped or account-scoped)
 */
async function assertLogPushJobExists(
  api: Awaited<ReturnType<typeof createCloudflareApi>>,
  zoneId: string | undefined,
  jobId: number,
): Promise<void> {
  const maxAttempts = 10;
  const delayMs = 1000;
  let attempt = 0;
  let lastResponse: Response | undefined;

  const basePath = zoneId
    ? `/zones/${zoneId}/logpush/jobs/${jobId}`
    : `/accounts/${api.accountId}/logpush/jobs/${jobId}`;

  while (attempt < maxAttempts) {
    const response = await api.get(basePath);
    lastResponse = response;
    if (response.ok) {
      const data: any = await response.json();
      if (data.result && data.result.id === jobId) {
        return;
      }
    }
    attempt++;
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `LogPush job ${jobId} did not appear within ${maxAttempts} seconds. Last response: ${lastResponse?.status}`,
  );
}

/**
 * Verify logpush job was deleted (with retry for eventual consistency)
 */
async function assertLogPushJobDeleted(
  api: Awaited<ReturnType<typeof createCloudflareApi>>,
  zoneId: string | undefined,
  jobId: number,
  attempt = 0,
): Promise<void> {
  const basePath = zoneId
    ? `/zones/${zoneId}/logpush/jobs/${jobId}`
    : `/accounts/${api.accountId}/logpush/jobs/${jobId}`;

  const response = await api.get(basePath);

  if (response.status === 404) {
    return;
  }

  if (response.ok && attempt < 10) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return assertLogPushJobDeleted(api, zoneId, jobId, attempt + 1);
  }

  throw new Error(`LogPush job ${jobId} was not deleted as expected`);
}
