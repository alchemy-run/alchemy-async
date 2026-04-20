import type { CloudflareApi } from "./api.ts";
import { findZoneForHostname, type Zone } from "./zone.ts";

export async function resolveEmailZoneId(
  api: CloudflareApi,
  zone: string | Zone,
): Promise<string> {
  return typeof zone === "string"
    ? (await findZoneForHostname(api, zone)).zoneId
    : zone.id;
}
