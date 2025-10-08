import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { secret, type Secret } from "../secret.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { AccountApiToken } from "./account-api-token.ts";
import { handleApiError, type CloudflareApiError } from "./api-error.ts";
import { extractCloudflareResult } from "./api-response.ts";
import { createCloudflareApi, type CloudflareApiOptions } from "./api.ts";
import { isBucket, type R2Bucket } from "./bucket.ts";

/**
 * Properties for creating or updating a LogPush Job
 */
export interface LogPushJobProps extends CloudflareApiOptions {
  /**
   * Zone ID or Zone object for zone-level LogPush jobs
   * Mutually exclusive with accountId
   */
  zone?: string | { id: string; name?: string };

  /**
   * Name of the dataset. A list of supported datasets can be found on the
   * Developer Docs
   * @default "http_requests"
   * @see https://developers.cloudflare.com/logs/reference/log-fields/
   */
  dataset: LogPushJobDataset;

  /**
   * Uniquely identifies a resource (such as an s3 bucket) where data will be
   * pushed. Additional configuration parameters supported by the destination
   * may be included (format: uri, maxLength: 4096)
   *
   * Can be:
   * - A full destination string (e.g., "s3://bucket/path" or "r2://bucket/path?account-id=...")
   * - An R2Bucket resource (will use bucket.name and R2 credentials from environment)
   * - A Secret containing a destination string
   */
  destination: string | R2Bucket | Secret<string>;

  /**
   * Filter to apply to logs (JSON string)
   * @example '{"where":{"and":[{"key":"ClientCountry","operator":"neq","value":"ca"}]}}'
   */
  filter?: string;

  /**
   * Optional human readable job name. Not unique. Cloudflare suggests that you
   * set this to a meaningful string, like the domain name, to make it easier to
   * identify your job (maxLength: 512)
   */
  name?: string | undefined;

  /**
   * Flag that indicates if the job is enabled
   */
  enabled?: boolean;

  /**
   * Ownership challenge token (obtained from ownership validation)
   * Required on creation if destination ownership not yet validated
   */
  ownershipChallenge?: string;

  /**
   * @deprecated This field is deprecated. Please use maxUploadBytes,
   * maxUploadIntervalSeconds, or maxUploadRecords instead. The frequency at
   * which Cloudflare sends batches of logs to your destination. Setting
   * frequency to high sends your logs in larger quantities of smaller files.
   * Setting frequency to low sends logs in smaller quantities of larger files
   */
  frequency?: "high" | "low" | undefined;

  /**
   * The kind parameter (optional) is used to differentiate between Logpush and
   * Edge Log Delivery jobs (when supported by the dataset)
   */
  kind?: "edge";

  /**
   * The maximum uncompressed file size of a batch of logs. This setting value
   * must be between 5 MB and 1 GB, or 0 to disable it. Note that you cannot
   * set a minimum file size; this means that log files may be much smaller than
   * this batch size
   */
  maxUploadBytes?: 0 | number | undefined;

  /**
   * The maximum interval in seconds for log batches. This setting must be
   * between 30 and 300 seconds (5 minutes), or 0 to disable it. Note that you
   * cannot specify a minimum interval for log batches; this means that log
   * files may be sent in shorter intervals than this
   */
  maxUploadIntervalSeconds?: 0 | number | undefined;

  /**
   * The maximum number of log lines per batch. This setting must be between
   * 1000 and 1,000,000 lines, or 0 to disable it. Note that you cannot specify
   * a minimum number of log lines per batch; this means that log files may
   * contain many fewer lines than this
   */
  maxUploadRecords?: 0 | number | undefined;

  /**
   * The structured replacement for logpull_options. When including this field,
   * the logpull_option field will be ignored
   */
  outputOptions?: LogPushJobOutputOptions;

  /**
   * Whether to delete the LogPush job when removed
   * @default true
   */
  delete?: boolean;
}

export interface LogPushJobOutputOptions {
  /**
   * String to join fields. This field will be ignored when recordTemplate is
   * set
   */
  fieldDelimiter?: string | undefined;

  /**
   * List of field names to be included in the Logpush output. For the moment,
   * there is no option to add all fields at once, so you must specify all the
   * field names you are interested in
   */
  fieldNames?: string[];

  /**
   * Specifies the output type, such as ndjson or csv. This sets default
   * values for the rest of the settings, depending on the chosen output type.
   * Some formatting rules, like string quoting, are different between output
   * types
   */
  outputType?: "ndjson" | "csv";

  /**
   * String to specify the format for timestamps, such as unixnano, unix, or
   * rfc3339
   */
  timestampFormat?: "unixnano" | "unix" | "rfc3339";

  /**
   * Floating number to specify sampling rate. Sampling is applied on top of
   * filtering, and regardless of the current sample_interval of the data
   * (minimum: 0, maximum: 1)
   */
  sampleRate?: number | undefined;

  /**
   * Prepended before each batch
   */
  batchPrefix?: string | undefined;

  /**
   * Appended after each batch
   */
  batchSuffix?: string | undefined;

  /**
   * If set to true, will cause all occurrences of ${ in the generated files
   * to be replaced with x{
   */
  cve202144228?: boolean | undefined;

  /**
   * Be inserted in-between the records as separator
   */
  recordDelimiter?: string | undefined;

  /**
   * Prepended before each record
   */
  recordPrefix?: string | undefined;

  /**
   * After each record
   */
  recordSuffix?: string | undefined;

  /**
   * Use as template for each record instead of the default json key value
   * mapping. All fields used in the template must be present in fieldNames as
   * well, otherwise they will end up as null. Format as a Go text/template
   * without any standard functions, like conditionals, loops, sub-templates,
   * etc
   */
  recordTemplate?: string | undefined;
}

/**
 * Output returned after LogPush Job creation/update
 */
export type LogPushJob = Omit<
  LogPushJobProps,
  "delete" | "ownershipChallenge" | "zone" | "destination"
> & {
  /**
   * Resource type identifier
   */
  type: "logpush_job";

  /**
   * Unique id of the job (minimum: 1)
   * Assigned by Cloudflare upon job creation
   */
  id?: number;

  /**
   * The Cloudflare account ID
   */
  accountId: string;

  /**
   * The destination of the job
   */
  destination: Secret<string>;

  /**
   * If not null, the job is currently failing. Failures are usually repetitive
   * (example: no permissions to write to destination bucket). Only the last
   * failure is recorded. On successful execution of a job the errorMessage and
   * lastError are set to null
   */
  errorMessage?: string | undefined;

  /**
   * Records the last time for which logs have been successfully pushed. If the
   * last successful push was for logs range 2018-07-23T10:00:00Z to
   * 2018-07-23T10:01:00Z then the value of this field will be
   * 2018-07-23T10:01:00Z. If the job has never run or has just been enabled and
   * hasn't run yet then the field will be empty (format: datetime)
   */
  lastComplete?: string | undefined;

  /**
   * Records the last time the job failed. If not null, the job is currently
   * failing. If null, the job has either never failed or has run successfully
   * at least once since last failure. See also the errorMessage field (format:
   * datetime)
   */
  lastError?: string | undefined;

  /**
   * Time at which the job was created (Unix timestamp in ms)
   */
  createdAt: number;

  /**
   * Time at which the job was last modified (Unix timestamp in ms)
   */
  modifiedAt: number;
};

/**
 * Check if a resource is a LogPushJob
 */
export function isLogPushJob(resource: any): resource is LogPushJob {
  return resource?.[ResourceKind] === "cloudflare::LogPushJob";
}

/**
 * Creates and manages Cloudflare LogPush Jobs for streaming logs to external
 * destinations.
 *
 * LogPush jobs can be scoped to either an account or a zone, and support
 * various log datasets like HTTP requests, firewall events, DNS logs, and more.
 *
 * @example
 * // Basic HTTP request logs to S3 (zone-level)
 * const httpLogs = await LogPushJob("http-logs", {
 *   zone: "example.com",
 *   dataset: "http_requests",
 *   destination: "s3://my-bucket/logs?region=us-west-2",
 *   name: "HTTP Request Logs"
 * });
 *
 * @example
 * // Account-level firewall events with filtering using a string destination
 * const blockedRequests = await LogPushJob("blocked-requests", {
 *   dataset: "firewall_events",
 *   destination: "r2://my-bucket/firewall-logs?account-id=xxx&access-key-id=xxx&secret-access-key=xxx",
 *   filter:
 *     '{"where":{"and":[{"key":"Action","operator":"eq","value":"block"}]}}',
 *   maxUploadBytes: 100 * 1024 * 1024, // 100MB batches
 *   maxUploadIntervalSeconds: 300 // 5 minutes
 * });
 *
 * @example
 * // Stream logs to R2 using R2Bucket resource (requires R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY env vars)
 * const bucket = await R2Bucket("logs-bucket", {
 *   name: "my-logs-bucket"
 * });
 *
 * const logsToR2 = await LogPushJob("http-to-r2", {
 *   dataset: "http_requests",
 *   destination: bucket  // Automatically constructs R2 URL with env credentials
 * });
 *
 * @example
 * // Or use a direct destination string with embedded credentials
 * const logsToR2 = await LogPushJob("http-to-r2", {
 *   dataset: "http_requests",
 *   destination: `r2://my-logs-bucket/logs/{DATE}?account-id=${accountId}&access-key-id=${R2_ACCESS_KEY_ID}&secret-access-key=${R2_SECRET_ACCESS_KEY}`
 * });
 *
 * @example
 * // High-volume analytics with custom output format
 * const analyticsLogs = await LogPushJob("analytics-logs", {
 *   zone: myZone,
 *   dataset: "http_requests",
 *   destination: "s3://analytics-bucket/logs?region=eu-west-1",
 *   sample: 0.01, // 1% sampling for high-volume sites
 *   maxUploadRecords: 100000, // 100k records per batch
 *   outputOptions: {
 *     outputType: "ndjson",
 *     timestampFormat: "unixnano",
 *     fieldNames: [
 *       "ClientIP",
 *       "ClientRequestHost",
 *       "EdgeResponseStatus",
 *       "EdgeStartTimestamp"
 *     ],
 *     sampleRate: 0.1 // Additional 10% sampling within the batch
 *   }
 * });
 *
 * @see https://developers.cloudflare.com/logs/get-started/enable-destinations/
 * @see https://developers.cloudflare.com/api/resources/logpush/
 */
export function LogPushJob(
  id: string,
  props: LogPushJobProps,
): Promise<LogPushJob> {
  return _LogPushJob(id, {
    ...props,
    destination:
      typeof props.destination === "string"
        ? secret(props.destination)
        : isBucket(props.destination)
          ? props.destination
          : props.destination,
  });
}

const _LogPushJob = Resource(
  "cloudflare::LogPushJob",
  async function (
    this: Context<LogPushJob>,
    _id: string,
    props: Omit<LogPushJobProps, "destination"> & {
      destination: Secret<string> | R2Bucket;
    },
  ): Promise<LogPushJob> {
    const api = await createCloudflareApi(props);
    const isZoneScoped = !!props.zone;

    let zoneId: string | undefined;
    let accountId: string | undefined;

    if (isZoneScoped) {
      zoneId = typeof props.zone === "string" ? props.zone : props.zone!.id;
    } else {
      accountId = api.accountId;
    }

    const basePath = isZoneScoped
      ? `/zones/${zoneId}/logpush/jobs`
      : `/accounts/${accountId}/logpush/jobs`;

    if (this.phase === "delete") {
      if (this.output?.id && props.delete !== false) {
        const deleteResponse = await api.delete(
          `${basePath}/${this.output.id}`,
        );

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          await handleApiError(
            deleteResponse,
            "delete",
            "logpush_job",
            String(this.output.id),
          );
        }
      }
      return this.destroy();
    }

    let destination: string;
    let apiToken: AccountApiToken | undefined;

    if (isBucket(props.destination)) {
      const bucket = props.destination;
      let accessKeyId = process.env.R2_ACCESS_KEY_ID;
      let secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

      if (!accessKeyId || !secretAccessKey) {
        try {
          apiToken = await AccountApiToken("token", {
            accountId: props.accountId,
            apiKey: props.apiKey,
            apiToken: props.apiToken,
            baseUrl: props.baseUrl,
            profile: props.profile,
            email: props.email,
            policies: [
              {
                effect: "allow",
                permissionGroups: [
                  "Workers R2 Storage Write",
                  "Workers R2 Storage Read",
                  "Workers R2 Storage Bucket Item Read",
                  "Workers R2 Storage Bucket Item Write",
                ],
                resources: {
                  [`com.cloudflare.edge.r2.bucket.${api.accountId}_${bucket.jurisdiction ?? "default"}_${bucket.name}`]:
                    "*",
                },
              },
            ],
          });
          accessKeyId = apiToken.accessKeyId.unencrypted;
          secretAccessKey = apiToken.secretAccessKey.unencrypted;
        } catch (err) {
          console.error(err);
          console.warn(
            "[Cloudflare Logpush Job] Warning: Cloudflare currently only allows the use of a Global API Key or an API Token with permission to create other API Tokens in order to generate new API Tokens programmatically.\n" +
              "Please use your Global API Key, or create an API Token with the necessary permissions. For more information, see: https://alchemy.run/guides/cloudflare/#api-token",
          );
          throw new Error(
            "Unable to create an API Token: Cloudflare only allows Global API Key or an API Token with permission to create other API Tokens. " +
              "See https://alchemy.run/guides/cloudflare/#api-token for more details.",
          );
        }
      }

      destination = `r2://${bucket.name}/logs/{DATE}?${new URLSearchParams({
        "account-id": api.accountId,
        "access-key-id": accessKeyId,
        "secret-access-key": secretAccessKey,
      }).toString()}`;
    } else {
      destination = props.destination.unencrypted;
    }

    const jobConfig: LogPushJobConfig = {
      dataset: props.dataset,
      destination_conf: destination,
      ...(props.name && { name: props.name }),
      ...(props.enabled !== undefined && { enabled: props.enabled }),
      ...(props.frequency && { frequency: props.frequency }),
      ...(props.kind !== undefined && { kind: props.kind }),
      ...(props.maxUploadBytes !== undefined && {
        max_upload_bytes: props.maxUploadBytes,
      }),
      ...(props.maxUploadIntervalSeconds !== undefined && {
        max_upload_interval_seconds: props.maxUploadIntervalSeconds,
      }),
      ...(props.maxUploadRecords !== undefined && {
        max_upload_records: props.maxUploadRecords,
      }),
      ...(props.ownershipChallenge && {
        ownership_challenge: props.ownershipChallenge,
      }),
    };

    if (props.outputOptions) {
      jobConfig.output_options = {
        ...(props.outputOptions.outputType && {
          output_type: props.outputOptions.outputType,
        }),
        ...(props.outputOptions.timestampFormat && {
          timestamp_format: props.outputOptions.timestampFormat,
        }),
        ...(props.outputOptions.fieldNames && {
          field_names: props.outputOptions.fieldNames,
        }),
        ...(props.outputOptions.fieldDelimiter && {
          field_delimiter: props.outputOptions.fieldDelimiter,
        }),
        ...(props.outputOptions.sampleRate !== undefined && {
          sample_rate: props.outputOptions.sampleRate,
        }),
        ...(props.outputOptions.batchPrefix && {
          batch_prefix: props.outputOptions.batchPrefix,
        }),
        ...(props.outputOptions.batchSuffix && {
          batch_suffix: props.outputOptions.batchSuffix,
        }),
        ...(props.outputOptions.cve202144228 !== undefined && {
          "CVE-2021-44228": props.outputOptions.cve202144228,
        }),
        ...(props.outputOptions.recordDelimiter && {
          record_delimiter: props.outputOptions.recordDelimiter,
        }),
        ...(props.outputOptions.recordPrefix && {
          record_prefix: props.outputOptions.recordPrefix,
        }),
        ...(props.outputOptions.recordSuffix && {
          record_suffix: props.outputOptions.recordSuffix,
        }),
        ...(props.outputOptions.recordTemplate && {
          record_template: props.outputOptions.recordTemplate,
        }),
      };
    }

    const jobData = await withExponentialBackoff(
      async () => {
        if (this.phase === "update" && this.output?.id) {
          return await extractCloudflareResult<LogPushJobConfig>(
            `update logpush job ${this.output.id}`,
            api.put(`${basePath}/${this.output.id}`, jobConfig),
          );
        } else {
          return await extractCloudflareResult<LogPushJobConfig>(
            `create logpush job for dataset ${props.dataset}`,
            api.post(basePath, jobConfig),
          );
        }
      },
      // if we just recently created an api token for R2, we can retry on 1002 which are caused by token propagation
      (error: CloudflareApiError) => {
        console.warn(
          "Received error when creating LogPush job, there may be a propagation delay",
          error.message,
        );
        return error.errorData?.[0]?.code === 1002;
      },
      30,
      100,
    );

    return {
      type: "logpush_job",
      id: jobData.id,
      accountId: api.accountId,
      dataset: jobData.dataset ?? props.dataset,
      destination: secret(jobData.destination_conf ?? destination),
      name: jobData.name ?? undefined,
      enabled: jobData.enabled ?? props.enabled ?? true,
      frequency: jobData.frequency ?? undefined,
      filter: props.filter,
      maxUploadBytes: jobData.max_upload_bytes ?? undefined,
      maxUploadIntervalSeconds:
        jobData.max_upload_interval_seconds ?? undefined,
      maxUploadRecords: jobData.max_upload_records ?? undefined,
      outputOptions: jobData.output_options
        ? {
            outputType: jobData.output_options.output_type,
            timestampFormat: jobData.output_options.timestamp_format,
            fieldNames: jobData.output_options.field_names,
            fieldDelimiter: jobData.output_options.field_delimiter ?? undefined,
            sampleRate: jobData.output_options.sample_rate ?? undefined,
            batchPrefix: jobData.output_options.batch_prefix ?? undefined,
            batchSuffix: jobData.output_options.batch_suffix ?? undefined,
            cve202144228: jobData.output_options["CVE-2021-44228"] ?? undefined,
            recordDelimiter:
              jobData.output_options.record_delimiter ?? undefined,
            recordPrefix: jobData.output_options.record_prefix ?? undefined,
            recordSuffix: jobData.output_options.record_suffix ?? undefined,
            recordTemplate: jobData.output_options.record_template ?? undefined,
          }
        : undefined,
      kind: jobData.kind || undefined,
      errorMessage: jobData.error_message ?? undefined,
      lastComplete: jobData.last_complete ?? undefined,
      lastError: jobData.last_error ?? undefined,
      createdAt: this.output?.createdAt ?? Date.now(),
      modifiedAt: Date.now(),
    };
  },
);
/**
 * The structured replacement for logpull_options. When including this field, the logpull_option field will be ignored.
 */
export interface OutputOptions {
  /**
   * String to be prepended before each batch.
   */
  batch_prefix?: string | null;

  /**
   * String to be appended after each batch.
   */
  batch_suffix?: string | null;

  /**
   * If set to true, will cause all occurrences of ${ in the generated files to be replaced with x{.
   */
  "CVE-2021-44228"?: boolean | null;

  /**
   * String to join fields. This field will be ignored when record_template is set.
   */
  field_delimiter?: string | null;

  /**
   * List of field names to be included in the Logpush output.
   * For the moment, there is no option to add all fields at once, so you must specify all the field names you are interested in.
   */
  field_names?: string[];

  /**
   * Specifies the output type, such as ndjson or csv.
   * This sets default values for the rest of the settings, depending on the chosen output type.
   * Some formatting rules, like string quoting, are different between output types.
   */
  output_type?: "ndjson" | "csv";

  /**
   * String to be inserted in-between the records as separator.
   */
  record_delimiter?: string | null;

  /**
   * String to be prepended before each record.
   */
  record_prefix?: string | null;

  /**
   * String to be appended after each record.
   */
  record_suffix?: string | null;

  /**
   * String to use as template for each record instead of the default json key value mapping.
   * All fields used in the template must be present in field_names as well, otherwise they will end up as null.
   * Format as a Go text/template without any standard functions, like conditionals, loops, sub-templates, etc.
   */
  record_template?: string | null;

  /**
   * Floating number to specify sampling rate. Sampling is applied on top of filtering, and regardless of the current sample_interval of the data.
   * (format: float, maximum: 1, minimum: 0)
   */
  sample_rate?: number | null;

  /**
   * String to specify the format for timestamps, such as unixnano, unix, or rfc3339.
   */
  timestamp_format?: "unixnano" | "unix" | "rfc3339";
}

export type LogPushJobDataset =
  | "access_requests"
  | "audit_logs_v2"
  | "audit_logs"
  | "biso_user_actions"
  | "casb_findings"
  | "device_posture_results"
  | "dlp_forensic_copies"
  | "dns_firewall_logs"
  | "dns_logs"
  | "email_security_alerts"
  | "firewall_events"
  | "gateway_dns"
  | "gateway_http"
  | "gateway_network"
  | "http_requests"
  | "magic_ids_detections"
  | "nel_reports"
  | "network_analytics_logs"
  | "page_shield_events"
  | "sinkhole_http_logs"
  | "spectrum_events"
  | "ssh_logs"
  | "workers_trace_events"
  | "zaraz_events"
  | "zero_trust_network_sessions"
  | (string & {});

/**
 * Raw Cloudflare API response for LogPush Job
 * @internal
 */
interface LogPushJobConfig {
  /**
   * Unique id of the job.
   * (minimum: 1)
   */
  id?: number;

  /**
   * Name of the dataset. A list of supported datasets can be found on the Developer Docs.
   * (default: "http_requests")
   */
  dataset?: LogPushJobDataset | null;

  /**
   * Uniquely identifies a resource (such as an s3 bucket) where data will be pushed.
   * (format: uri, maxLength: 4096)
   */
  destination_conf?: string;

  /**
   * Flag that indicates if the job is enabled.
   */
  enabled?: boolean;

  /**
   * If not null, the job is currently failing. Only the last failure is recorded.
   */
  error_message?: string | null;

  /**
   * Deprecated. Please use max_upload_* parameters instead.
   * The frequency at which Cloudflare sends batches of logs to your destination.
   * (default: "high")
   */
  frequency?: "high" | "low" | null;

  /**
   * The kind parameter (optional) is used to differentiate between Logpush and Edge Log Delivery jobs.
   */
  kind?: "" | "edge";

  /**
   * Records the last time for which logs have been successfully pushed.
   * (format: date-time)
   */
  last_complete?: string | null;

  /**
   * Records the last time the job failed.
   * (format: date-time)
   */
  last_error?: string | null;

  /**
   * Deprecated. Use output_options instead.
   * Configuration string.
   * (format: uri-reference, maxLength: 4096)
   */
  logpull_options?: string | null;

  /**
   * The maximum uncompressed file size of a batch of logs.
   * Must be between 5 MB and 1 GB, or 0 to disable it.
   */
  max_upload_bytes?: 0 | number | null;

  /**
   * The maximum interval in seconds for log batches.
   * Must be between 30 and 300 seconds, or 0 to disable it.
   */
  max_upload_interval_seconds?: 0 | number | null;

  /**
   * The maximum number of log lines per batch.
   * Must be between 1000 and 1,000,000 lines, or 0 to disable it.
   */
  max_upload_records?: 0 | number | null;

  /**
   * Optional human readable job name. Not unique.
   * (maxLength: 512)
   */
  name?: string | null;

  /**
   * The structured replacement for logpull_options.
   * When including this field, the logpull_option field will be ignored.
   */
  output_options?: OutputOptions | null;
}
