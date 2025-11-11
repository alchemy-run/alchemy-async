export function isTransientNetworkError(err: any) {
  return (
    err?.code === "UND_ERR_SOCKET" ||
    err?.code === "ECONNRESET" ||
    err?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    err?.code === "EPIPE" ||
    err?.name === "FetchError"
  );
}
