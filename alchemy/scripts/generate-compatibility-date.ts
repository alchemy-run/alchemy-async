#!/usr/bin/env bun

/**
 * Fetches the latest Workers compatibility date from the npm registry
 * and writes it to a file to use as the default compatibility date.
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "pathe";

const compatibilityDate = await fetchWorkersCompatibilityDate();
console.log(`Fetched Workers compatibility date: ${compatibilityDate}`);

// TypeScript content to generate
const content = `// This file is auto-generated during build
// Do not edit manually

/**
 * The default Cloudflare Workers compatibility date, set based on the latest workerd release at the time of build.
 */
export const DEFAULT_COMPATIBILITY_DATE = "${compatibilityDate}";
`;

// Write to src directory so it gets included in the package
const outputPath = resolve(
  import.meta.dirname,
  "..",
  "src",
  "cloudflare",
  "compatibility-date.gen.ts",
);

await writeFile(outputPath, content, "utf8");

console.log(`Written to: ${outputPath}`);

/**
 * Fetches the latest Workers compatibility date.
 * Adapted from https://github.com/cloudflare/workers-sdk/blob/9f0c175ab668217f78debab4dfdb3e677040b9b0/packages/create-cloudflare/src/helpers/compatDate.ts#L19
 */
async function fetchWorkersCompatibilityDate() {
  const res = await fetch("https://registry.npmjs.org/workerd");
  const json = (await res.json()) as {
    "dist-tags": { latest: string };
  };
  const version = json["dist-tags"].latest;
  const match = version.match(/\d+\.(\d{4})(\d{2})(\d{2})\.\d+/);

  // workerd releases often have a date for the following day.
  // Unfortunately, Workers deployments will fail if they specify
  // a compatibility date in the future. This means that most
  // who create a new project on the same day as a workerd
  // release will have their deployments fail until they
  // manually adjust the compatibility date.
  //
  // To work around this, we must manually ensure that the compat date
  // is not on a future UTC day when there was a recent workerd release.
  if (match) {
    const [, year, month, date] = match;
    let compatDate = new Date(`${year}-${month}-${date}`);
    if (compatDate.getTime() > Date.now()) {
      compatDate = new Date(Date.now());
    }
    const compatDateString = compatDate.toISOString().slice(0, 10);
    return compatDateString;
  }

  throw new Error(
    `Failed to parse compatibility date from version "${version}"`,
  );
}
