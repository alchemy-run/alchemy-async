import alchemy from "alchemy";
import { R2Bucket, R2BucketCustomDomain } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-worker");

export const bucket = await R2Bucket("bucket");

export const domain = await R2BucketCustomDomain("domain", {
  bucketName: bucket.name,
  domain: "johnroyal.dev",
});

console.dir(domain, { depth: null });

await app.finalize();
