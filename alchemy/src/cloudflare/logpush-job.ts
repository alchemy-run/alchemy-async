import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { isSecret, secret, type Secret } from "../secret.ts";
import { AccountApiToken } from "./account-api-token.ts";
import { handleApiError } from "./api-error.ts";
import { extractCloudflareResult } from "./api-response.ts";
import { createCloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { R2Bucket } from "./bucket.ts";

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
  dataset: string;

  /**
   * Uniquely identifies a resource (such as an s3 bucket) where data will be
   * pushed. Additional configuration parameters supported by the destination
   * may be included (format: uri, maxLength: 4096)
   */
  destination: string | R2Bucket | Secret<string>;

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
   * Filter to apply to logs (JSON string)
   * @example '{"where":{"and":[{"key":"ClientCountry","operator":"neq","value":"ca"}]}}'
   */
  filter?: string | undefined;

  /**
   * Sampling rate (0.01 to 1.0)
   */
  sample?: number;

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
 *   destinationConf: "s3://my-bucket/logs?region=us-west-2",
 *   name: "HTTP Request Logs"
 * });
 *
 * @example
 * // Account-level firewall events with filtering
 * const blockedRequests = await LogPushJob("blocked-requests", {
 *   dataset: "firewall_events",
 *   destinationConf: "r2://my-bucket/firewall-logs",
 *   filter:
 *     '{"where":{"and":[{"key":"Action","operator":"eq","value":"block"}]}}',
 *   maxUploadBytes: 100 * 1024 * 1024, // 100MB batches
 *   maxUploadIntervalSeconds: 300 // 5 minutes
 * });
 *
 * @example
 * // High-volume analytics with custom output format
 * const analyticsLogs = await LogPushJob("analytics-logs", {
 *   zone: myZone,
 *   dataset: "http_requests",
 *   destinationConf: "s3://analytics-bucket/logs?region=eu-west-1",
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
 * @example
 * // Security monitoring with multiple datasets
 * const securityLogs = await LogPushJob("security-monitoring", {
 *   dataset: "audit_logs_v2",
 *   destinationConf: "s3://security-bucket/audit-logs?region=us-east-1",
 *   filter:
 *     '{"where":{"or":[{"key":"Action","operator":"eq","value":"login"},' +
 *     '{"key":"Action","operator":"eq","value":"logout"}]}}',
 *   maxUploadIntervalSeconds: 60, // 1 minute batches for real-time monitoring
 *   outputOptions: {
 *     outputType: "csv",
 *     fieldDelimiter: ",",
 *     timestampFormat: "rfc3339",
 *     fieldNames: ["Action", "User", "IP", "Timestamp", "Result"]
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

    console.log("create api token");
    const apiToken = isSecret(props.destination)
      ? undefined
      : await AccountApiToken("token", {
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
                [`com.cloudflare.api.account.${api.accountId}`]: "*",
              },
            },
          ],
        });

    const destination = isSecret(props.destination)
      ? props.destination.unencrypted
      : `r2://${props.destination.name}/logs/{DATE}?${new URLSearchParams({
          "account-id": api.accountId,
          "access-key-id": apiToken!.accessKeyId.unencrypted,
          "secret-access-key": apiToken!.secretAccessKey.unencrypted,
        }).toString()}`;

    console.log({ destination });

    const jobConfig: LogPushJobConfig = {
      dataset: props.dataset,
      destination_conf: destination,
      ...(props.name && { name: props.name }),
      ...(props.enabled !== undefined && { enabled: props.enabled }),
      ...(props.filter && { filter: props.filter }),
      ...(props.sample !== undefined && { sample: props.sample }),
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

    let jobData: LogPushJobConfig;

    console.log(jobConfig);

    if (this.phase === "update" && this.output?.id) {
      jobData = await extractCloudflareResult<LogPushJobConfig>(
        `update logpush job ${this.output.id}`,
        api.put(`${basePath}/${this.output.id}`, jobConfig),
      );
    } else {
      jobData = await extractCloudflareResult<LogPushJobConfig>(
        `create logpush job for dataset ${props.dataset}`,
        api.post(basePath, jobConfig),
      );
    }

    return {
      type: "logpush_job",
      id: jobData.id,
      accountId: api.accountId,
      dataset: jobData.dataset ?? props.dataset,
      destination: secret(jobData.destination_conf ?? destination),
      name: jobData.name ?? undefined,
      enabled: jobData.enabled ?? props.enabled ?? true,
      filter: jobData.filter,
      sample: jobData.sample,
      frequency: jobData.frequency ?? undefined,
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
      kind: jobData.kind,
      errorMessage: jobData.error_message ?? undefined,
      lastComplete: jobData.last_complete ?? undefined,
      lastError: jobData.last_error ?? undefined,
      createdAt: this.output?.createdAt ?? Date.now(),
      modifiedAt: Date.now(),
    };
  },
);

export interface OutputOptions {
  batch_prefix?: string | undefined;
  batch_suffix?: string | undefined;
  "CVE-2021-44228"?: boolean | undefined;
  field_delimiter?: string | undefined;
  field_names?: string[];
  output_type?: "ndjson" | "csv";
  record_delimiter?: string | undefined;
  record_prefix?: string | undefined;
  record_suffix?: string | undefined;
  record_template?: string | undefined;
  sample_rate?: number | undefined;
  timestamp_format?: "unixnano" | "unix" | "rfc3339";
}

export type LogPushJobDataset =
  | "access_requests"
  | "audit_logs"
  | "audit_logs_v2"
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
  id?: number;
  dataset?: LogPushJobDataset;
  destination_conf?: string;
  enabled?: boolean;
  error_message?: string | undefined;
  frequency?: "high" | "low" | undefined;
  kind?: "edge";
  last_complete?: string | undefined;
  last_error?: string | undefined;
  logpull_options?: string | undefined;
  max_upload_bytes?: 0 | number | undefined;
  max_upload_interval_seconds?: 0 | number | undefined;
  max_upload_records?: 0 | number | undefined;
  name?: string | undefined;
  output_options?: OutputOptions | undefined;
  filter?: string | undefined;
  sample?: number;
  created_on?: string;
  modified_on?: string;
}
