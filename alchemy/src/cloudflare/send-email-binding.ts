export interface BaseSendEmailBindingProps {
  allowedSenderAddresses?: string[];
  dev?: {
    remote?: boolean;
  };
}

export type SendEmailBindingProps = BaseSendEmailBindingProps &
  (
    | {
        destinationAddress?: string;
        allowedDestinationAddresses?: never;
      }
    | {
        destinationAddress?: never;
        allowedDestinationAddresses?: string[];
      }
  );

/**
 * Type representing a Cloudflare Email Service send binding.
 * @see https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
 */
export type SendEmailBinding = SendEmailBindingProps & {
  type: "send_email";
};

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
  props: SendEmailBindingProps = {},
): SendEmailBinding {
  return {
    type: "send_email",
    ...props,
  };
}
