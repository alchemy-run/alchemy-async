export type BaseSendEmailProps = {
  allowedSenderAddresses?: Array<string>;
  dev?: { remote?: boolean };
};

export type SendEmailProps = BaseSendEmailProps &
  (
    | {
        destinationAddress?: string;
      }
    | {
        allowedDestinationAddresses?: Array<string>;
      }
  );

export type SendEmail = SendEmailProps & {
  type: "send_email";
};

export function SendEmail(props?: SendEmailProps): SendEmail {
  return { type: "send_email", ...props };
}
