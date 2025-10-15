/**
 * A binding for dynamic worker loaders.
 *
 */
export type WorkerLoader = {
  type: "worker_loader";
};
export function WorkerLoader(): WorkerLoader {
  return {
    type: "worker_loader",
  };
}
