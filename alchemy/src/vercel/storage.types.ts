import type { VercelEnvironments } from "./vercel.types.ts";

export type StorageType = "blob";

export interface StorageProject {
  projectId: string;
  envVarEnvironments: VercelEnvironments;
  envVarPrefix?: string;
}

export interface StorageProjectMetadata {
  environments: VercelEnvironments;
  environmentVariables: string[];
  envVarPrefix?: string;
  framework: string;
  id: string;
  name: string;
  projectId: string;
}
