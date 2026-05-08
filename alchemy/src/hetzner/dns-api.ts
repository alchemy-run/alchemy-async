import type { Secret } from "../secret.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { safeFetch } from "../util/safe-fetch.ts";

export interface HetznerDnsApiOptions {
  apiToken?: Secret;
}

export class HetznerDnsApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code: string) {
    super(`Hetzner DNS API error (${status}): ${message}`);
    this.status = status;
    this.code = code;
  }
}

export function createHetznerDnsApi(
  options: HetznerDnsApiOptions = {},
): HetznerDnsApi {
  const apiToken =
    options.apiToken?.unencrypted ?? process.env.HETZNER_DNS_API_TOKEN;
  if (!apiToken) {
    throw new Error(
      "Hetzner DNS API token is required. Set HETZNER_DNS_API_TOKEN environment variable or provide apiToken option.",
    );
  }
  return new HetznerDnsApi(apiToken);
}

class HetznerDnsApi {
  private readonly baseUrl = "https://dns.hetzner.com/api/v1";
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      ...((init.headers as Record<string, string>) ?? {}),
      "Content-Type": "application/json",
      "Auth-API-Token": this.token,
    };

    return withExponentialBackoff(
      async () => {
        const response = await safeFetch(`${this.baseUrl}${path}`, {
          ...init,
          headers,
        });
        if (response.status === 429) {
          throw new TooManyRequestsError(response.statusText);
        }
        if (response.status >= 500) {
          throw new InternalError(response.statusText);
        }
        if (!response.ok) {
          const data: any = await response.json();
          throw new HetznerDnsApiError(
            response.status,
            data.message ?? response.statusText,
            String(response.status),
          );
        }
        return response;
      },
      (error) =>
        error instanceof TooManyRequestsError || error instanceof InternalError,
    );
  }

  async get(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "GET" });
  }

  async post(
    path: string,
    body?: unknown,
    init: RequestInit = {},
  ): Promise<Response> {
    return this.fetch(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put(
    path: string,
    body?: unknown,
    init: RequestInit = {},
  ): Promise<Response> {
    return this.fetch(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "DELETE" });
  }
}

class InternalError extends Error {}

class TooManyRequestsError extends Error {}
