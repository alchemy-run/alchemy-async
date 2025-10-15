---
title: LogPushJob
description: Learn how to create, configure, and manage Cloudflare LogPush Jobs for streaming logs to R2 buckets and HTTPS endpoints.
---

Creates and manages [Cloudflare LogPush Jobs](https://developers.cloudflare.com/logs/get-started/enable-destinations/) for streaming logs to external destinations.

LogPush jobs can be scoped to either an account or a zone, and support various log datasets like HTTP requests, firewall events, DNS logs, Workers trace events, and more.

## Minimal Example

Stream HTTP request logs to an R2 bucket:

```ts
import { LogPushJob, R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("logs-bucket", {
  name: "my-logs-bucket",
});

const httpLogs = await LogPushJob("http-logs", {
  dataset: "http_requests",
  destination: bucket, // Automatically constructs R2 URL with credentials
});
```

:::tip
When using an R2Bucket resource, credentials are automatically managed. Set `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` environment variables, or Alchemy will create an API token for you.
:::

## Using R2 with Path Variables

Organize logs by date using path variables:

```ts
import { LogPushJob, R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("logs-bucket", {
  name: "my-logs-bucket",
});

const organizedLogs = await LogPushJob("organized-logs", {
  dataset: "http_requests",
  destination: bucket,
  name: "HTTP Logs - Daily",
});
```

The destination will automatically include `{DATE}` path variables: `r2://my-logs-bucket/logs/{DATE}/...`

## Direct R2 Destination String

Alternatively, use a direct destination string with embedded credentials:

```ts
import { LogPushJob } from "alchemy/cloudflare";

const logsToR2 = await LogPushJob("http-to-r2", {
  dataset: "http_requests",
  destination: `r2://my-logs-bucket/logs/{DATE}?account-id=${accountId}&access-key-id=${accessKeyId}&secret-access-key=${secretAccessKey}`,
});
```

## Zone-Scoped Logs

Create a LogPush job scoped to a specific zone:

```ts
import { LogPushJob, Zone } from "alchemy/cloudflare";

const zone = await Zone("example-zone", {
  name: "example.com",
  type: "full",
});

const zoneLogs = await LogPushJob("zone-http-logs", {
  zone, // or zone object: zone
  dataset: "http_requests",
  destination: "https://logs.example.com/cloudflare/zone",
  name: "Zone HTTP Logs",
});
```

## Account-Level Logs

Create an account-level LogPush job (default when `zone` is not specified):

```ts
import { LogPushJob } from "alchemy/cloudflare";

const accountLogs = await LogPushJob("account-firewall-logs", {
  dataset: "firewall_events",
  destination: "https://logs.example.com/cloudflare/firewall",
  name: "Account Firewall Logs",
});
```

## Workers Trace Events to R2

Stream Workers trace events to R2 for performance analysis and debugging:

```ts
import { LogPushJob, R2Bucket, Worker } from "alchemy/cloudflare";

// Create R2 bucket for worker logs
const bucket = await R2Bucket("workers-logs", {
  name: "workers-trace-logs",
});

// Enable LogPush on your worker
const worker = await Worker("api", {
  entrypoint: "./src/api.ts",
  logpush: true, // Enable trace event collection
});

// Stream trace events to R2
const workerLogs = await LogPushJob("worker-traces", {
  dataset: "workers_trace_events",
  destination: bucket,
  outputOptions: {
    outputType: "ndjson",
    fieldNames: [
      "Event",
      "EventTimestampMs",
      "Outcome",
      "ScriptName",
      "Logs",
      "Exceptions",
      "DispatchNamespace",
    ],
  },
});
```

:::note
Workers must have `logpush: true` enabled to generate trace events. The LogPush job collects events from all workers in the account.
:::

## With Filtering

Filter logs based on specific conditions:

```ts
import { LogPushJob } from "alchemy/cloudflare";

const blockedRequests = await LogPushJob("blocked-requests", {
  dataset: "firewall_events",
  destination: "https://logs.example.com/security/blocked",
  filter: '{"where":{"and":[{"key":"Action","operator":"eq","value":"block"}]}}',
  name: "Blocked Requests",
});
```

Filter by country (excluding Canada):

```ts
const nonCanadianLogs = await LogPushJob("non-canadian-logs", {
  dataset: "http_requests",
  destination: "https://logs.example.com/http/filtered",
  filter: '{"where":{"and":[{"key":"ClientCountry","operator":"neq","value":"ca"}]}}',
});
```

## Custom Output Format

Configure custom output format with specific fields:

```ts
import { LogPushJob } from "alchemy/cloudflare";

const customFormat = await LogPushJob("custom-format-logs", {
  dataset: "http_requests",
  destination: "https://analytics.example.com/ingest/custom",
  outputOptions: {
    outputType: "ndjson",
    timestampFormat: "unixnano",
    fieldNames: [
      "ClientIP",
      "ClientRequestHost",
      "ClientRequestMethod",
      "ClientRequestURI",
      "EdgeResponseStatus",
      "EdgeStartTimestamp",
    ],
  },
});
```

CSV output with custom delimiter:

```ts
const csvLogs = await LogPushJob("csv-logs", {
  dataset: "http_requests",
  destination: "https://analytics.example.com/ingest/csv",
  outputOptions: {
    outputType: "csv",
    fieldDelimiter: "|",
    timestampFormat: "rfc3339",
    fieldNames: ["ClientIP", "EdgeResponseStatus", "EdgeStartTimestamp"],
  },
});
```

## With Sampling

Sample high-volume logs to reduce storage costs:

```ts
import { LogPushJob } from "alchemy/cloudflare";

const sampledLogs = await LogPushJob("sampled-logs", {
  dataset: "http_requests",
  destination: "https://analytics.example.com/sampled",
  outputOptions: {
    sampleRate: 0.1, // 10% sampling
    outputType: "ndjson",
    fieldNames: ["ClientIP", "EdgeResponseStatus", "EdgeStartTimestamp"],
  },
});
```

## Batch Configuration

Configure batch size, interval, and record limits:

```ts
import { LogPushJob } from "alchemy/cloudflare";

const batchedLogs = await LogPushJob("batched-logs", {
  dataset: "http_requests",
  destination: "https://logs.example.com/batched",
  maxUploadBytes: 100 * 1024 * 1024, // 100MB batches
  maxUploadIntervalSeconds: 300, // 5 minutes max interval
  maxUploadRecords: 100000, // 100k records per batch
});
```

**Batch Settings:**

| Setting                      | Range                | Default | Purpose                           |
| ---------------------------- | -------------------- | ------- | --------------------------------- |
| `maxUploadBytes`             | 5MB - 1GB, or 0      | -       | Max uncompressed file size        |
| `maxUploadIntervalSeconds`   | 30 - 300s, or 0      | -       | Max time before sending batch     |
| `maxUploadRecords`           | 1,000 - 1,000,000, 0 | -       | Max log lines per batch           |

:::tip
Set to `0` to disable a specific limit. Logs may be sent with smaller sizes/intervals than configured.
:::

## With Custom Template

Use a custom template for log formatting:

```ts
import { LogPushJob } from "alchemy/cloudflare";

const templateLogs = await LogPushJob("template-logs", {
  dataset: "http_requests",
  destination: "https://logs.example.com/template",
  outputOptions: {
    fieldNames: ["ClientIP", "EdgeResponseStatus", "EdgeStartTimestamp"],
    recordTemplate: '{"ip":"{{.ClientIP}}","status":{{.EdgeResponseStatus}},"time":{{.EdgeStartTimestamp}}}',
    recordDelimiter: "\n",
  },
});
```

## Available Datasets

LogPush supports the following datasets:

**Zone-Level:**
- `http_requests` - HTTP request logs
- `firewall_events` - WAF and firewall events
- `dns_logs` - Authoritative DNS logs
- `dns_firewall_logs` - DNS firewall logs
- `spectrum_events` - Spectrum application events
- `nel_reports` - Network Error Logging reports

**Account-Level:**
- `workers_trace_events` - Workers execution traces
- `audit_logs` - Cloudflare audit logs
- `gateway_dns` - Gateway DNS logs
- `gateway_http` - Gateway HTTP logs
- `gateway_network` - Gateway network logs
- `access_requests` - Access authentication logs
- `casb_findings` - CASB security findings
- `device_posture_results` - Zero Trust device posture
- `zero_trust_network_sessions` - Network session logs
- `magic_ids_detections` - Magic IDS detections
- `page_shield_events` - Page Shield events

:::tip
See the [Cloudflare Log Fields Reference](https://developers.cloudflare.com/logs/reference/log-fields/) for available fields per dataset.
:::

## Destination Formats

LogPush supports multiple destination types:

**HTTPS Endpoints:**
```
https://logs.example.com/cloudflare/endpoint
```

**Sumo Logic:**
```
https://endpoint.sumologic.com/receiver/v1/http/xxx
```

**Splunk:**
```
https://http-inputs-example.splunkcloud.com/services/collector/raw?channel=xxx
```

**Datadog (use HTTPS format):**
```
https://http-intake.logs.datadoghq.com/api/v2/logs?dd-api-key=xxx&ddsource=cloudflare
```

**R2 (recommended - use R2Bucket resource):**
```
r2://bucket-name/path?account-id=xxx&access-key-id=xxx&secret-access-key=xxx
```

:::tip
For R2 destinations, use the `R2Bucket` resource for automatic credential management. For HTTPS endpoints, credentials can be included as query parameters or headers depending on your destination's requirements.
:::
