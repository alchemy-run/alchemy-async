import { fromPromise } from 'neverthrow';
import type { VercelApi } from './api.ts';
import type { Storage, StorageProps } from './storage.ts';
import type { StorageProject, StorageProjectMetadata } from './storage.types.ts';
import type { VercelTeam } from './vercel.types.ts';

function getTeamId(team: string | VercelTeam) {
  return typeof team === 'string' ? team : team.id;
}

export function projectPropsChanged(a: StorageProject, b: StorageProject) {
  return (
    a.projectId !== b.projectId ||
    a.envVarPrefix !== b.envVarPrefix ||
    JSON.stringify(a.envVarEnvironments) !== JSON.stringify(b.envVarEnvironments)
  );
}

export async function readStorage(api: VercelApi, output: Storage) {
  const teamId = getTeamId(output.team);
  const response = await fromPromise(api.get(`/storage/stores/${output.id}?teamId=${teamId}`), (err) => err as Error);

  if (response.isErr()) {
    throw response.error;
  }

  return response.value.json() as Promise<{ store: Storage }>;
}

export async function createStorage(api: VercelApi, props: StorageProps) {
  const teamId = getTeamId(props.team);
  const response = await fromPromise(api.post(`/storage/stores/${props.type}?teamId=${teamId}`, {
    name: props.name,
    region: props.region,
  }), (err) => err as Error);

  if (response.isErr()) {
    throw response.error;
  }

  return response.value.json() as Promise<{ store: Storage }>;
}

export async function deleteStorage(api: VercelApi, output: Storage) {
  const teamId = getTeamId(output.team);
  const connections = await fromPromise(api.delete(`/storage/stores/${output.id}/connections?teamId=${teamId}`), (err) => err as Error);

  if (connections.isErr()) {  
    throw connections.error;
  }

  const storage = await fromPromise(api.delete(`/storage/stores/${output.type}/${output.id}?teamId=${teamId}`), (err) => err as Error);

  if (storage.isErr()) {
    throw storage.error;
  }
}

export async function createProjectsConnection(api: VercelApi, output: Storage, projects: StorageProject[]) {
  // Promise.all didn't worked well with the API, so we're using a for loop instead
  for (const project of projects) {
    await connectProject(api, output, project);
  }
}

export async function deleteProjectsConnection(api: VercelApi, output: Storage, projectsMetadata: StorageProjectMetadata[]) {
  // Promise.all didn't worked well with the API, so we're using a for loop instead
  for (const metadata of projectsMetadata) {
    await disconnectProject(api, output, metadata);
  }
}

export async function connectProject(api: VercelApi, output: Storage, project: StorageProject) {
  const teamId = getTeamId(output.team);
  const response = await fromPromise(api.post(`/storage/stores/${output.id}/connections?teamId=${teamId}`, {
    envVarEnvironments: project.envVarEnvironments,
    envVarPrefix: project.envVarPrefix,
    projectId: project.projectId,
  }), (err) => err as Error);

  if (response.isErr()) {
    throw response.error;
  }
}

export async function disconnectProject(api: VercelApi, output: Storage, metadata: StorageProjectMetadata) {
  const teamId = getTeamId(output.team);
  const response = await fromPromise(api.delete(`/storage/stores/${output.id}/connections/${metadata.id}?teamId=${teamId}`), (err) => err as Error);

  if (response.isErr()) {
    throw response.error;
  }
}