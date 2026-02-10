import { poll } from "../util/poll.ts";
import type { PlanetScaleClient } from "./api/sdk.gen.ts";
import type { DatabaseBranch } from "./api/types.gen.ts";

export type PlanetScaleClusterSize =
  | "PS_DEV"
  | "PS_5"
  | "PS_10"
  | "PS_20"
  | "PS_40"
  | "PS_80"
  | "PS_160"
  | "PS_320"
  | "PS_400"
  | "PS_640"
  | "PS_700"
  | "PS_900"
  | "PS_1280"
  | "PS_1400"
  | "PS_1800"
  | "PS_2100"
  | "PS_2560"
  | "PS_2700"
  | "PS_2800"
  | (string & {});

/**
 * Ensures that the given cluster size is in the correct format.
 */
export function sanitizeClusterSize(input: {
  size: PlanetScaleClusterSize;
  kind?: "mysql" | "postgresql";
  arch?: "x86" | "arm";
  region?: string;
}): string {
  // NAS-backed Postgres cluster sizes are formatted as `PS_<size>_<provider>_<arch>`,
  // where <provider> is either "AWS" or "GCP", and <arch> is either "ARM" or "X86".
  // Postgres clusters backed by PlanetScale Metal are more complex (e.g. "M6_160_AWS_INTEL_D_METAL_118"),
  // so to avoid messing with those, we just check for AWS or GCP in the size.
  if (input.kind === "postgresql" && !input.size.match(/(AWS|GCP)/)) {
    // Infer the provider from the region.
    // Not all AWS regions start with "aws-", but all GCP regions start with "gcp-".
    const provider = input.region?.startsWith("gcp") ? "GCP" : "AWS";
    const arch = (input.arch ?? "x86").toUpperCase();
    return `${input.size}_${provider}_${arch}`;
  }
  return input.size;
}

/**
 * Polls a branch until it is ready.
 */
export async function waitForBranchReady(
  api: PlanetScaleClient,
  organization: string,
  database: string,
  branch: string,
): Promise<DatabaseBranch> {
  const { data } = await poll({
    description: `branch "${branch}" ready`,
    fn: () =>
      api.getBranch({
        path: { organization, database, branch },
      }),
    predicate: ({ data }) => data.ready,
  });
  return data;
}

/**
 * Polls a database until it is ready.
 */
export async function waitForDatabaseReady(
  api: PlanetScaleClient,
  organization: string,
  database: string,
): Promise<void> {
  await poll({
    description: `database "${database}" ready`,
    fn: () =>
      api.getDatabase({
        path: { organization, database },
      }),
    predicate: ({ data }) => data.ready,
  });
}

/**
 * Polls a keyspace until it is finished resizing.
 */
export async function waitForKeyspaceReady(
  api: PlanetScaleClient,
  organization: string,
  database: string,
  branch: string,
  keyspace: string,
): Promise<void> {
  await poll({
    description: `keyspace "${keyspace}" ready`,
    fn: () =>
      api.listKeyspaceResizes({
        path: { organization, database, branch, name: keyspace },
      }),
    predicate: ({ data }) =>
      data.data.every((item) => item.state !== "resizing"),
    initialDelay: 100,
    maxDelay: 1000,
  });
}

/**
 * Ensure a branch is production and has the correct cluster size.
 * If a branch is not production, it will be promoted to production because
 * cluster sizes can only be configured for production branches.
 */
export async function ensureProductionBranchClusterSize(
  api: PlanetScaleClient,
  organization: string,
  database: string,
  branch: string,
  kind: "mysql" | "postgresql",
  expectedClusterSize: PlanetScaleClusterSize,
): Promise<void> {
  switch (kind) {
    case "mysql": {
      // Vitess databases must be promoted before resizing
      await ensureProductionBranch(api, organization, database, branch);
      await ensureMySQLClusterSize(
        api,
        organization,
        database,
        branch,
        expectedClusterSize,
      );
      break;
    }
    case "postgresql": {
      // Postgres databases do not need to be promoted; PS_DEV is development and all others are production
      await ensurePostgresClusterSize(
        api,
        organization,
        database,
        branch,
        expectedClusterSize,
      );
      break;
    }
  }
}

/**
 * Checks if a branch is production and promotes it if it is not.
 */
async function ensureProductionBranch(
  api: PlanetScaleClient,
  organization: string,
  database: string,
  branch: string,
): Promise<void> {
  const { data } = await api.getBranch({
    path: {
      organization,
      database,
      branch,
    },
  });
  if (!data.production) {
    if (!data.ready) {
      await waitForBranchReady(api, organization, database, branch);
    }
    await api.promoteBranch({
      path: { organization, database, branch },
    });
  }
}

/**
 * Ensures that a MySQL branch has the correct cluster size.
 */
async function ensureMySQLClusterSize(
  api: PlanetScaleClient,
  organization: string,
  database: string,
  branch: string,
  expectedClusterSize: PlanetScaleClusterSize,
): Promise<void> {
  // 1. Load default keyspace
  const { data: keyspaces } = await api.listKeyspaces({
    path: {
      organization,
      database,
      branch,
    },
  });
  const defaultKeyspace = keyspaces.data.find((x) => x.name === database); // Default keyspace is always the same name as the database
  if (!defaultKeyspace) {
    throw new Error(`No default keyspace found for branch ${branch}`);
  }

  // 2. Wait until any in-flight resize is done
  await waitForKeyspaceReady(
    api,
    organization,
    database,
    branch,
    defaultKeyspace.name,
  );

  // 3. If size mismatch, trigger resize and wait again
  // Ideally this would use the undocumented Keyspaces API, but there seems to be a missing oauth scope that we cannot add via the console yet
  if (defaultKeyspace.cluster_name !== expectedClusterSize) {
    await api.updateBranchClusterConfig({
      path: {
        organization,
        database,
        branch,
      },
      body: { cluster_size: expectedClusterSize },
    });

    // Poll until the resize completes
    await waitForKeyspaceReady(
      api,
      organization,
      database,
      branch,
      defaultKeyspace.name,
    );
  }
}

/**
 * Ensures that a Postgres branch has the correct cluster size.
 */
async function ensurePostgresClusterSize(
  api: PlanetScaleClient,
  organization: string,
  database: string,
  branch: string,
  expectedClusterSize: PlanetScaleClusterSize,
): Promise<void> {
  const { data } = await api.getBranch({
    path: {
      organization,
      database,
      branch,
    },
  });
  if (data.cluster_name === expectedClusterSize) {
    return;
  }
  await waitForPendingPostgresChanges(api, organization, database, branch);
  const { data: change } = await api.updateBranchChangeRequest({
    path: {
      organization,
      database,
      branch,
    },
    body: {
      cluster_size: expectedClusterSize,
    },
  });
  await waitForPendingPostgresChanges(
    api,
    organization,
    database,
    branch,
    change.id,
  );
}

/**
 * Polls for a pending Postgres change to be completed.
 */
async function waitForPendingPostgresChanges(
  api: PlanetScaleClient,
  organization: string,
  database: string,
  branch: string,
  changeId?: string,
) {
  await poll({
    description: `changes for branch "${branch}"`,
    fn: () =>
      api.listBranchChangeRequests({
        path: { organization, database, branch },
      }),
    predicate: ({ data }) =>
      data.data.every(
        (change) =>
          change.state === "completed" ||
          change.state === "canceled" ||
          (changeId && change.id === changeId),
      ),
  });
}
