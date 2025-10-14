import type { Secret } from "../../secret.ts";

/**
 * Supported Prisma Postgres regions
 */
export type PrismaPostgresRegion =
  | "us-east-1"
  | "us-west-1"
  | "eu-west-3"
  | "eu-central-1"
  | "ap-northeast-1"
  | "ap-southeast-1";

/**
 * Authentication options shared across Prisma Postgres resources
 */
export interface PrismaPostgresAuthProps {
  /**
   * Service token used to authenticate with the Prisma Postgres Management API
   *
   * @default process.env.PRISMA_SERVICE_TOKEN
   */
  serviceToken?: string | Secret<string>;

  /**
   * Optional workspace identifier. When provided it will be sent in API requests
   * to scope operations explicitly to a workspace.
   */
  workspaceId?: string;

  /**
   * Override the Management API base URL (useful for testing)
   *
   * @default https://api.prisma.io/v1
   */
  baseUrl?: string;
}

/**
 * Generic pagination metadata returned by the Management API
 */
export interface PrismaPagination {
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Shape of error responses returned by the Management API
 */
export interface PrismaErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Workspace object returned by the Management API
 */
export interface PrismaWorkspace {
  id: string;
  type: "workspace";
  name: string;
  createdAt: string;
}

/**
 * Workspace list response
 */
export interface PrismaWorkspaceListResponse {
  data: PrismaWorkspace[];
  pagination: PrismaPagination;
}

/**
 * Summary information about a workspace embedded inside other responses
 */
export interface PrismaWorkspaceSummary {
  id: string;
  name: string;
}

/**
 * Connection string information returned alongside databases
 */
export interface PrismaDatabaseConnection {
  id: string;
  type: "connection";
  name: string;
  createdAt: string;
  connectionString: string;
  directConnection: {
    host: string;
    user: string;
    pass: string;
  } | null;
  database: PrismaProjectSummary;
}

/**
 * Metadata for a connection as returned by list endpoints (no secrets)
 */
export interface PrismaConnectionListItem {
  id: string;
  type: "connection";
  name: string;
  createdAt: string;
  database: PrismaProjectSummary;
}

/**
 * Database object returned by the Management API
 */
export interface PrismaDatabase {
  id: string;
  type: "database";
  name: string;
  status: "failure" | "provisioning" | "ready" | "recovering";
  createdAt: string;
  isDefault: boolean;
  project: PrismaProjectSummary;
  region: {
    id: PrismaPostgresRegion;
    name: string;
  } | null;
  apiKeys: PrismaDatabaseConnection[];
  connectionString: string | null;
  directConnection: {
    host: string;
    user: string;
    pass: string;
  } | null;
}

/**
 * Project summary embedded within other responses
 */
export interface PrismaProjectSummary {
  id: string;
  name: string;
}

/**
 * Project object returned by the Management API
 */
export interface PrismaProject {
  id: string;
  type: "project";
  name: string;
  createdAt: string;
  theme: string | null;
  workspace: PrismaWorkspaceSummary;
  database: PrismaDatabase | null;
}

/**
 * List response for projects
 */
export interface PrismaProjectListResponse {
  data: PrismaProject[];
  pagination: PrismaPagination;
}

/**
 * Database list response
 */
export interface PrismaDatabaseListResponse {
  data: PrismaDatabase[];
  pagination: PrismaPagination;
}

/**
 * Database connections list response
 */
export interface PrismaConnectionListResponse {
  data: PrismaConnectionListItem[];
  pagination: PrismaPagination;
}

/**
 * Database backups list response
 */
export interface PrismaDatabaseBackupsResponse {
  data: PrismaDatabaseBackup[];
  meta: {
    backupRetentionDays: number;
  };
  pagination: {
    hasMore: boolean;
    limit: number | null;
  };
}

/**
 * Database backup representation returned by the API
 */
export interface PrismaDatabaseBackup {
  id: string;
  type: "backup";
  backupType: "full" | "incremental";
  status: "running" | "completed" | "failed" | "unknown";
  createdAt: string;
  size?: number;
}
