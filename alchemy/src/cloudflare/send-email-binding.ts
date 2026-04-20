/**
 * Type representing a Cloudflare Email Service send binding.
 * @see https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
 */
export interface SendEmailBinding {
  type: "send_email";
  destinationAddress?: string;
  allowedDestinationAddresses?: string[];
  allowedSenderAddresses?: string[];
  dev?: {
    remote?: boolean;
  };
}

/**
 * Creates a Cloudflare Email Service binding for sending emails from Workers.
 *
 * Set `dev.remote` to `true` to use the real Cloudflare email binding while
 * running the Worker locally.
 *
 * @example
 * ```ts
 * const email = SendEmailBinding({
 *   allowedSenderAddresses: ["noreply@example.com"],
 *   dev: { remote: true },
 * });
 * ```
 *
 * @see https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
 */
export function SendEmailBinding(
  props: Omit<SendEmailBinding, "type"> = {},
): SendEmailBinding {
  if (props.destinationAddress && props.allowedDestinationAddresses?.length) {
    throw new Error(
      "SendEmailBinding cannot define both destinationAddress and allowedDestinationAddresses",
    );
  }

  return {
    type: "send_email",
    ...props,
  };
}
