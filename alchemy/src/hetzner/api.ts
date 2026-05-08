import type { Secret } from "../secret.ts";

/**
 * Options for Hetzner API authentication and endpoint configuration.
 */
export interface HetznerApiOptions {
  /**
   * Hetzner Cloud API token. Overrides HCLOUD_TOKEN env var.
   */
  apiToken?: Secret;

  /**
   * Base URL for Hetzner Cloud API.
   * @default "https://api.hetzner.cloud/v1"
   */
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.hetzner.cloud/v1";

export interface HetznerActionResponse {
  action: {
    id: number;
    status: "running" | "success" | "error";
    error?: { code: string; message: string };
  };
}

export class HetznerApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = String(status)) {
    super(`Hetzner API error (${status}): ${message}`);
    this.name = "HetznerApiError";
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, HetznerApiError.prototype);
  }
}

/** @deprecated Use HetznerApiError */
export const HetznerError = HetznerApiError;

/**
 * Minimal typed Hetzner REST client.
 */
export class HetznerApi {
  readonly baseUrl: string;
  readonly apiToken: string;

  constructor(options: HetznerApiOptions = {}) {
    this.apiToken =
      options.apiToken?.unencrypted ?? process.env.HCLOUD_TOKEN ?? "";
    if (!this.apiToken) {
      throw new Error(
        "Hetzner Cloud API token is required. Set HCLOUD_TOKEN environment variable or provide apiToken option.",
      );
    }
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  private async _fetch(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    let delay = 500;
    const headers: Record<string, string> = {
      ...((init.headers as Record<string, string>) ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiToken}`,
    };
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 8_000);
        continue;
      }
      return res;
    }
    return fetch(`${this.baseUrl}${path}`, { ...init, headers });
  }

  private async _parse<T>(res: Response): Promise<T> {
    if (res.status === 204) return undefined as T;
    const data = (await res.json().catch(() => {
      throw new HetznerApiError(res.status, "Invalid JSON response");
    })) as { error?: { code: string; message: string } } & T;
    if (!res.ok) {
      const err = data.error;
      throw new HetznerApiError(
        res.status,
        err?.message ?? res.statusText,
        err?.code,
      );
    }
    return data;
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this._parse<T>(await this._fetch(path, { method: "GET" }));
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this._parse<T>(
      await this._fetch(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    );
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this._parse<T>(
      await this._fetch(path, {
        method: "PUT",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    );
  }

  async delete(path: string): Promise<void> {
    const res = await this._fetch(path, { method: "DELETE" });
    if (res.status !== 204 && res.status !== 404 && !res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = (data as any)?.error;
      throw new HetznerApiError(
        res.status,
        err?.message ?? res.statusText,
        err?.code,
      );
    }
  }

  async deleteAndWait(path: string, timeoutMs = 120_000): Promise<void> {
    const res = await this._fetch(path, { method: "DELETE" });
    if (res.status === 404) return;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = (data as any)?.error;
      throw new HetznerApiError(res.status, err?.message ?? res.statusText, err?.code);
    }
    if (res.status === 204) return;
    const data = await res.json().catch(() => ({}));
    const actionId = (data as any)?.action?.id;
    if (actionId) {
      await this.waitForAction(actionId, timeoutMs);
    }
  }

  /**
   * Poll a Hetzner action until it succeeds or errors out.
   */
  async waitForAction(actionId: number, timeoutMs = 120_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let delay = 1_000;
    while (Date.now() < deadline) {
      const data = await this.get<{
        action: { status: string; error?: { message: string } };
      }>(`/actions/${actionId}`);
      if (data.action.status === "success") return;
      if (data.action.status === "error") {
        throw new Error(
          `Hetzner action ${actionId} failed: ${data.action.error?.message}`,
        );
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 5_000);
    }
    throw new Error(
      `Hetzner action ${actionId} timed out after ${timeoutMs}ms`,
    );
  }
}

export function createHetznerApi(options: HetznerApiOptions): HetznerApi {
  return new HetznerApi(options);
}

/**
 * Extract a typed result from a raw fetch Response, throwing HetznerApiError on failure.
 * @internal
 */
export async function extractHetznerResult<T>(
  label: string,
  promise: Promise<Response>,
): Promise<T> {
  const response = await promise.catch((cause) => {
    throw new Error(`Failed to ${label}: Failed to fetch`, { cause });
  });
  if (response.status === 204) return undefined as T;
  const json = (await response.json().catch(() => {
    throw new Error(
      `Failed to ${label} (${response.status}): Invalid response`,
    );
  })) as { error?: { code: string; message: string } } & T;
  if (!response.ok) {
    const err = json.error;
    throw new HetznerApiError(
      response.status,
      err?.message ?? response.statusText,
      err?.code,
    );
  }
  return json;
}
