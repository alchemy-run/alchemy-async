import type { Secret } from "../secret.ts";
import { createClient } from "../util/api/client/client.gen.ts";
import type { ClientOptions } from "../util/api/client/types.gen.ts";
import { createConfig } from "../util/api/client/utils.gen.ts";
import { PrismaClient } from "./api/sdk.gen.ts";

export interface PrismaApiOptions {
  /**
   * The service token to use for the API
   */
  serviceToken?: Secret<string>;
}

export class PrismaApi extends Error {
  status: number;
  method: string;
  url: string;
  code: string;

  constructor(props: {
    error: {
      status?: number;
      error?: string;
    };
    request: Request;
    response: Response;
  }) {
    const { status, error } = props.error;
    super(
      `A request to the Prisma API failed (${props.response.status}): ${error}`,
    );
    this.status = props.response.status;
    this.method = props.request.method;
    this.url = props.request.url;
    this.code = status?.toString() ?? "";
    Object.assign(this, props.error);
  }
}

/**
 * Create a PrismaApi instance with environment variable fallback
 * @param options API options
 * @returns PrismaApi instance
 */
export function createPrismaApi(
  options: Partial<PrismaApiOptions> = {},
): PrismaClient {
  const serviceToken =
    options.serviceToken?.unencrypted ?? process.env.PRISMA_SERVICE_TOKEN;
  if (!serviceToken) {
    throw new Error("PRISMA_SERVICE_TOKEN is not set");
  }
  const client = createClient(
    createConfig<ClientOptions>({
      baseUrl: "https://api.prisma.io",
      throwOnError: true,
      headers: {
        Authorization: `Bearer ${serviceToken}`,
      },
    }),
  );

  client.interceptors.error.use((error, response, request, options) => {
    if (options.throwOnError !== false) {
      throw new PrismaApi({
        error: error as {
          status?: number;
          error?: string;
        },
        request,
        response,
      });
    }
  });

  return new PrismaClient({
    client,
  });
}
