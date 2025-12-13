import type { Context } from "../context.ts";
/**
 * Properties for creating or updating a GitHub Repository Webhook
 */
export interface RepositoryWebhookProps {
    /**
     * Repository owner (user or organization)
     */
    owner: string;
    /**
     * Repository name
     */
    repository: string;
    /**
     * The URL to which the payloads will be delivered
     */
    url: string;
    /**
     * Webhook secret for payload validation
     * @default undefined
     */
    secret?: string;
    /**
     * The media type used to serialize the payloads
     * @default "application/json"
     */
    contentType?: "application/json" | "application/x-www-form-urlencoded";
    /**
     * Determines whether the SSL certificate of the host for url will be verified
     * @default false
     */
    insecureSsl?: boolean;
    /**
     * Determines if notifications are sent when the webhook is triggered
     * @default true
     */
    active?: boolean;
    /**
     * Determines what events the hook is triggered for
     * @default ["push"]
     */
    events?: string[];
    /**
     * Optional GitHub API token (overrides environment variable)
     * If not provided, will use GITHUB_TOKEN environment variable
     * @default process.env.GITHUB_TOKEN
     */
    token?: string;
}
/**
 * Output returned after Repository Webhook creation/update
 */
export interface RepositoryWebhook extends RepositoryWebhookProps {
    /**
     * The ID of the resource
     */
    id: string;
    /**
     * The numeric ID of the webhook in GitHub
     */
    webhookId: number;
    /**
     * The webhook URL that was configured
     */
    url: string;
    /**
     * Time at which the object was created
     */
    createdAt: string;
    /**
     * Time at which the object was last updated
     */
    updatedAt: string;
    /**
     * The ping URL for the webhook
     */
    pingUrl: string;
    /**
     * The test URL for the webhook
     */
    testUrl: string;
}
/**
 * Resource for managing GitHub repository webhooks
 *
 * Webhooks allow external services to be notified when certain events happen in a repository.
 * This resource manages the full lifecycle of repository webhooks including creation, updates, and deletion.
 *
 * @example
 * // Create a basic webhook for push events
 * const pushWebhook = await RepositoryWebhook("push-webhook", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   url: "https://my-service.com/github-webhook",
 *   events: ["push"]
 * });
 *
 * @example
 * // Create a webhook with secret validation for multiple events
 * const ciWebhook = await RepositoryWebhook("ci-webhook", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   url: "https://ci.example.com/webhook",
 *   secret: "my-webhook-secret",
 *   events: ["push", "pull_request", "release"],
 *   contentType: "application/json"
 * });
 *
 * @example
 * // Create a webhook for all events with custom SSL settings
 * const monitoringWebhook = await RepositoryWebhook("monitoring-webhook", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   url: "https://monitoring.internal.com/github",
 *   secret: "super-secret-key",
 *   events: ["*"], // All events
 *   insecureSsl: true, // For internal services with self-signed certs
 *   contentType: "application/x-www-form-urlencoded"
 * });
 */
export declare const RepositoryWebhook: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<RepositoryWebhook>, _id: string, props: RepositoryWebhookProps) => Promise<RepositoryWebhook>);
//# sourceMappingURL=repository-webhook.d.ts.map