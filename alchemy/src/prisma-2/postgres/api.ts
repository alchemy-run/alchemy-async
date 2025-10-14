import type {
  PrismaConnectionListResponse,
  PrismaDatabase,
  PrismaDatabaseBackupsResponse,
  PrismaDatabaseListResponse,
  PrismaDatabaseConnection,
  PrismaErrorResponse,
  PrismaPostgresAuthProps,
  PrismaPostgresRegion,
  PrismaProject,
  PrismaProjectListResponse,
  PrismaWorkspace,
  PrismaWorkspaceListResponse,
} from "./types.ts";

/**
 * Error thrown when the Prisma Postgres Management API returns a non-success response
 */
export class PrismaPostgresApiError extends Error {
  readonly status: number;
  readonly method: string;
  readonly url: string;
  readonly code?: string;
  readonly responseBody?: unknown;

  constructor(props: {
    status: number;
    method: string;
    url: string;
    message: string;
    code?: string;
    responseBody?: unknown;
  }) {
    super(props.message);
    this.status = props.status;
    this.method = props.method;
    this.url = props.url;
    this.code = props.code;
    this.responseBody = props.responseBody;
  }
}

/**
 * Minimal client for the Prisma Postgres Management API
 */
export class PrismaPostgresApi {
  readonly baseUrl: string;
  readonly serviceToken: string;

  constructor(options: PrismaPostgresAuthProps = {}) {
    const base = options.baseUrl ?? "https://api.prisma.io/v1";
    this.baseUrl = base.endsWith("/") ? base.slice(0, -1) : base;

    const token = options.serviceToken
      ? typeof options.serviceToken === "string"
        ? options.serviceToken
        : options.serviceToken.unencrypted
      : process.env.PRISMA_SERVICE_TOKEN;

    if (!token) {
      throw new Error(
        "Prisma Postgres service token is required. Set PRISMA_SERVICE_TOKEN or provide serviceToken in props.",
      );
    }

    this.serviceToken = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    if (!path.startsWith("/")) {
      throw new Error(`API path must start with a slash. Received: ${path}`);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${this.serviceToken}`,
    };

    let payload: string | undefined;
    if (body && Object.keys(body).length > 0) {
      payload = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: payload,
    });

    const text = await response.text();
    const maybeJson = text ? safeJsonParse(text) : undefined;

    if (!response.ok) {
      const errorBody = maybeJson as PrismaErrorResponse | undefined;
      const message =
        errorBody?.error?.message ??
        `Prisma Postgres API request failed (${response.status} ${response.statusText})`;
      throw new PrismaPostgresApiError({
        status: response.status,
        method,
        url: `${this.baseUrl}${path}`,
        message,
        code: errorBody?.error?.code,
        responseBody: maybeJson ?? text,
      });
    }

    if (!text) return undefined as T;
    return maybeJson as T;
  }

  async listWorkspaces(): Promise<PrismaWorkspaceListResponse> {
    return this.request("GET", "/workspaces");
  }

  async getWorkspaceById(id: string): Promise<PrismaWorkspace | undefined> {
    const response = await this.listWorkspaces();
    return response.data.find((workspace) => workspace.id === id);
  }

  async getWorkspaceByName(name: string): Promise<PrismaWorkspace | undefined> {
    const response = await this.listWorkspaces();
    return response.data.find((workspace) => workspace.name === name);
  }

  async listProjects(cursor?: string): Promise<PrismaProjectListResponse> {
    const query = cursor ? `?cursor=${cursor}` : "";
    return this.request("GET", `/projects${query}`);
  }

  async getProject(id: string): Promise<PrismaProject | undefined> {
    try {
      const response = await this.request<{ data: PrismaProject }>(
        "GET",
        `/projects/${id}`,
      );
      return response.data;
    } catch (error) {
      if (error instanceof PrismaPostgresApiError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async createProject(params: {
    name: string;
    region?: PrismaPostgresRegion;
    createDatabase?: boolean;
  }): Promise<PrismaProject> {
    const body: Record<string, unknown> = {
      name: params.name,
    };
    if (params.region) {
      body.region = params.region;
    }
    if (params.createDatabase !== undefined) {
      body.createDatabase = params.createDatabase;
    }
    const response = await this.request<{ data: PrismaProject }>(
      "POST",
      "/projects",
      body,
    );
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.request("DELETE", `/projects/${id}`);
    } catch (error) {
      if (error instanceof PrismaPostgresApiError && error.status === 404) {
        return;
      }
      throw error;
    }
  }

  async createDatabase(params: {
    projectId: string;
    name: string;
    region: PrismaPostgresRegion;
    isDefault?: boolean;
    fromDatabase?: {
      id: string;
      backupId?: string;
    };
  }): Promise<PrismaDatabase> {
    const body: Record<string, unknown> = {
      name: params.name,
      region: params.region,
    };
    if (params.isDefault !== undefined) {
      body.isDefault = params.isDefault;
    }
    if (params.fromDatabase) {
      body.fromDatabase = params.fromDatabase;
    }
    const response = await this.request<{ data: PrismaDatabase }>(
      "POST",
      `/projects/${params.projectId}/databases`,
      body,
    );
    return response.data;
  }

  async listProjectDatabases(
    projectId: string,
    cursor?: string,
  ): Promise<PrismaDatabaseListResponse> {
    const query = cursor ? `?cursor=${cursor}` : "";
    return this.request("GET", `/projects/${projectId}/databases${query}`);
  }

  async getDatabase(databaseId: string): Promise<PrismaDatabase | undefined> {
    try {
      const response = await this.request<{ data: PrismaDatabase }>(
        "GET",
        `/databases/${databaseId}`,
      );
      return response.data;
    } catch (error) {
      if (error instanceof PrismaPostgresApiError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async deleteDatabase(databaseId: string): Promise<void> {
    try {
      await this.request("DELETE", `/databases/${databaseId}`);
    } catch (error) {
      if (
        error instanceof PrismaPostgresApiError &&
        (error.status === 404 || error.status === 403)
      ) {
        return;
      }
      throw error;
    }
  }

  async createConnection(params: {
    databaseId: string;
    name: string;
  }): Promise<PrismaDatabaseConnection> {
    const response = await this.request<{ data: PrismaDatabaseConnection }>(
      "POST",
      `/databases/${params.databaseId}/connections`,
      { name: params.name },
    );
    return response.data;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    try {
      await this.request("DELETE", `/connections/${connectionId}`);
    } catch (error) {
      if (error instanceof PrismaPostgresApiError && error.status === 404) {
        return;
      }
      throw error;
    }
  }

  async listConnections(
    databaseId: string,
    cursor?: string,
  ): Promise<PrismaConnectionListResponse> {
    const query = cursor ? `?cursor=${cursor}` : "";
    return this.request("GET", `/databases/${databaseId}/connections${query}`);
  }

  async listDatabaseBackups(params: {
    databaseId: string;
    limit?: number;
  }): Promise<PrismaDatabaseBackupsResponse> {
    const query = params.limit ? `?limit=${params.limit}` : "";
    return this.request(
      "GET",
      `/databases/${params.databaseId}/backups${query}`,
    );
  }
}

function safeJsonParse(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
