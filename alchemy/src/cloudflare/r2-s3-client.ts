import { AwsClient } from "aws4fetch";
import type { BucketProps } from "./bucket";

export interface R2S3ClientOptions
  extends Pick<
    BucketProps,
    "accessKeyId" | "secretAccessKey" | "sessionToken" | "profile" | "accountId"
  > {}

export interface R2S3Client {
  client: AwsClient;
  endpoint: string;
}

export function createR2S3Client(options: R2S3ClientOptions): R2S3Client {
  const accessKeyId = options.accessKeyId?.unencrypted;
  const secretAccessKey = options.secretAccessKey?.unencrypted;
  const sessionToken = options.sessionToken?.unencrypted;
  const accountId =
    options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? undefined;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      [
        "Cloudflare R2 multipart uploads require S3-compatible credentials.",
        "Pass accessKeyId and secretAccessKey to the R2Bucket resource.",
      ].join(" "),
    );
  }

  if (!accountId) {
    throw new Error(
      "Cloudflare account ID is required to perform multipart uploads.",
    );
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    sessionToken,
    service: "s3",
    region: "auto",
  });

  return {
    client,
    endpoint: endpoint.replace(/\/$/, ""),
  };
}
