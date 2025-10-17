type GetBackendUrlProps = {
  // If you're using routes with paths in your worker configuration, you'll need to pass the path you want to use here, e.g. "/api"
  routePath?: string;
};

/**
 * Use this function in your frontend code to automatically get the correct URL for your backend API in both local and deployed environments
 * @param param0 { path: string }
 * @returns
 */
export function getBackendUrl({ routePath }: GetBackendUrlProps = {}): URL {
  let pathToUse = !routePath
    ? "/"
    : routePath.startsWith("/")
      ? routePath
      : `/${routePath}`;
  // This is ugly but it's necessary to support both local and prod environments
  // Start with the current host
  let backendUrl = `${window.location.protocol}//${window.location.host}${pathToUse}`;
  try {
    // Bun will only inline this if we use exactly `process.env.BUN_PUBLIC_BACKEND_URL` it we use other forms including process?.env for example bun will not inline it
    // we can't check typeof process either because process may not be available but Bun may already have inlined process.env.BUN_PUBLIC_BACKEND_URL with the correct value
    backendUrl = process.env.BUN_PUBLIC_BACKEND_URL ?? backendUrl;
  } catch {
    // Bun may not have had anything to inline and process.env may not exist to above can throw an error
    // do nothing
  }
  return new URL(backendUrl);
}
