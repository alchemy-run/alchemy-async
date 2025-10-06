import { alchemy } from "./alchemy.ts";
import { context } from "./context.ts";
import { destroy, DestroyStrategy } from "./destroy.ts";
import {
  PROVIDERS,
  ResourceFQN,
  ResourceID,
  ResourceKind,
  ResourceScope,
  ResourceSeq,
  type PendingResource,
  type Provider,
  type Resource,
  type ResourceAttributes,
  type ResourceProps,
} from "./resource.ts";
import type { PendingDeletions } from "./scope.ts";
import { serialize } from "./serde.ts";
import type { State } from "./state.ts";
import { formatFQN } from "./util/cli.ts";
import { logger } from "./util/logger.ts";
import { createAndSendEvent } from "./util/telemetry.ts";

export interface ApplyOptions {
  quiet?: boolean;
  alwaysUpdate?: boolean;
  noop?: boolean;
}

export function apply<Out extends ResourceAttributes>(
  resource: PendingResource<Out>,
  props: ResourceProps | undefined,
  options?: ApplyOptions,
): Promise<Awaited<Out> & Resource> {
  return _apply(resource, props, options);
}

export function isReplacedSignal(error: any): error is ReplacedSignal {
  return error instanceof Error && (error as any).kind === "ReplacedSignal";
}

export class ReplacedSignal extends Error {
  readonly kind = "ReplacedSignal";
  public force: boolean;

  constructor(force?: boolean) {
    super();
    this.force = force ?? false;
  }
}

async function _apply<Out extends ResourceAttributes>(
  resource: PendingResource<Out>,
  props: ResourceProps | undefined,
  options?: ApplyOptions,
): Promise<Awaited<Out> & Resource> {
  const scope = resource[ResourceScope];
  const start = performance.now();
  try {
    const quiet = props?.quiet ?? scope.quiet;
    await scope.init();
    let state = await scope.state.get(resource[ResourceID]);
    const provider: Provider = PROVIDERS.get(resource[ResourceKind]);
    if (provider === undefined) {
      throw new Error(`Provider "${resource[ResourceKind]}" not found`);
    }
    if (scope.phase === "read") {
      if (state === undefined) {
        if (scope.isSelected === false) {
          // we are running in a monorepo and are not the selected app
          if (process.argv.includes("--destroy")) {
            // if we are trying to destroy a downstream app and this (upstream) app does not have data, then exit
            process.exit(0);
          }
          // if we are in `--deploy`, then poll until state available
          state = await waitForConsistentState();
        } else {
          throw new Error(
            `Resource "${resource[ResourceFQN]}" not found and running in 'read' phase. Selected(${scope.isSelected})`,
          );
        }
      } else if (scope.isSelected === false) {
        // we are running in a monorepo and are not the selected app, so we need to wait for the process to be consistent
        state = await waitForConsistentState();
      }
      createAndSendEvent({
        event: "resource.read",
        phase: scope.phase,
        duration: performance.now() - start,
        status: state.status,
        resource: resource[ResourceKind],
        replaced: false,
      });
      return state.output as Awaited<Out> & Resource;

      // -> poll until it does not (i.e. when the owner process applies the change and updates the state store)
      async function waitForConsistentState() {
        while (true) {
          if (state === undefined) {
            // state doesn't exist yet
          } else if (
            state.status === "creating" ||
            state.status === "updating"
          ) {
            // no-op
          } else if (
            state.status === "deleted" ||
            state.status === "deleting"
          ) {
            // ok something is wrong, the stack should not be being deleted
            // TODO(sam): better error message
            throw new Error("Resource is being deleted");
          } else if (await inputsAreEqual(state)) {
            // sweet, we've reached a stable state and read can progress
            return state;
          }
          // jitter between 100-300ms
          const jitter = 100 + Math.random() * 200;
          await new Promise((resolve) => setTimeout(resolve, jitter));
          state = await scope.state.get(resource[ResourceID]);
        }
      }
      async function inputsAreEqual(
        state: State<string, ResourceProps | undefined, Resource>,
      ) {
        const oldProps = await serialize(scope, state.props, {
          encrypt: false,
        });
        const newProps = await serialize(scope, props, {
          encrypt: false,
        });
        return JSON.stringify(oldProps) === JSON.stringify(newProps);
      }
    }

    if (state === undefined) {
      state = {
        kind: resource[ResourceKind],
        id: resource[ResourceID],
        fqn: resource[ResourceFQN],
        seq: resource[ResourceSeq],
        status: "creating",
        data: {},
        output: {
          [ResourceID]: resource[ResourceID],
          [ResourceFQN]: resource[ResourceFQN],
          [ResourceKind]: resource[ResourceKind],
          [ResourceScope]: scope,
          [ResourceSeq]: resource[ResourceSeq],
          [DestroyStrategy]: provider.options?.destroyStrategy ?? "sequential",
        },
        // deps: [...deps],
        // there are no "old props" on initialization
        props: {},
      };
      await scope.state.set(resource[ResourceID], state);
    }

    const oldOutput = state.output;

    const alwaysUpdate =
      options?.alwaysUpdate ?? provider.options?.alwaysUpdate ?? false;

    // Skip update if inputs haven't changed and resource is in a stable state
    if (state.status === "created" || state.status === "updated") {
      const oldProps = await serialize(scope, state.props, {
        encrypt: false,
      });
      const newProps = await serialize(scope, props, {
        encrypt: false,
      });
      if (
        JSON.stringify(oldProps) === JSON.stringify(newProps) &&
        alwaysUpdate !== true &&
        !scope.force
      ) {
        if (!quiet) {
          logger.task(resource[ResourceFQN], {
            prefix: "skipped",
            prefixColor: "yellowBright",
            resource: formatFQN(resource[ResourceFQN]),
            message: "Skipped Resource (no changes)",
            status: "success",
          });
        }
        createAndSendEvent({
          event: "resource.skip",
          resource: resource[ResourceKind],
          status: state.status,
          phase: scope.phase,
          duration: performance.now() - start,
          replaced: false,
        });
        return state.output as Awaited<Out> & Resource;
      }
    }

    const phase = state.status === "creating" ? "create" : "update";
    state.status = phase === "create" ? "creating" : "updating";
    state.oldProps = state.props;
    state.props = props;

    if (!quiet) {
      logger.task(resource[ResourceFQN], {
        prefix: phase === "create" ? "creating" : "updating",
        prefixColor: "magenta",
        resource: formatFQN(resource[ResourceFQN]),
        message: `${phase === "create" ? "Creating" : "Updating"} Resource...`,
      });
    }

    createAndSendEvent({
      event: "resource.start",
      resource: resource[ResourceKind],
      status: state.status,
      phase: scope.phase,
      duration: performance.now() - start,
      replaced: false,
    });

    await scope.state.set(resource[ResourceID], state);

    let isReplaced = false;

    const ctx = context({
      scope,
      phase,
      kind: resource[ResourceKind],
      id: resource[ResourceID],
      fqn: resource[ResourceFQN],
      seq: resource[ResourceSeq],
      props: state.oldProps,
      state,
      isReplacement: false,
      replace: (force?: boolean) => {
        if (phase === "create") {
          throw new Error(
            `Resource ${resource[ResourceKind]} ${resource[ResourceFQN]} cannot be replaced in create phase.`,
          );
        }
        if (isReplaced) {
          logger.warn(
            `Resource ${resource[ResourceKind]} ${resource[ResourceFQN]} is already marked as REPLACE`,
          );
        }

        isReplaced = true;
        throw new ReplacedSignal(force);
      },
    });

    let output: any;
    try {
      output = await alchemy.run(
        resource[ResourceID],
        {
          isResource: true,
          parent: scope,
          destroyStrategy: provider.options?.destroyStrategy ?? "sequential",
          noop: options?.noop,
        },
        async () =>
          ctx(await provider.handler.bind(ctx)(resource[ResourceID], props)),
      );
    } catch (error) {
      if (error instanceof ReplacedSignal) {
        if (error.force) {
          await destroy(resource, {
            quiet: scope.quiet,
            strategy: resource[DestroyStrategy] ?? "sequential",
            replace: {
              props: state.oldProps,
              output: oldOutput,
            },
            noop: options?.noop,
          });
        } else {
          if (
            (scope.children.get(resource[ResourceID])?.children.size ?? 0) > 0
          ) {
            throw new Error(
              `Resource ${resource[ResourceFQN]} has children and cannot be replaced.`,
            );
          }
          const pendingDeletions =
            (await scope.get<PendingDeletions>("pendingDeletions")) ?? [];
          pendingDeletions.push({
            resource: oldOutput,
            oldProps: state.oldProps,
          });
          await scope.set("pendingDeletions", pendingDeletions);
        }

        output = await alchemy.run(
          resource[ResourceID],
          {
            isResource: true,
            parent: scope,
            noop: options?.noop,
          },
          async () => {
            const ctx = context({
              scope,
              phase: "create",
              kind: resource[ResourceKind],
              id: resource[ResourceID],
              fqn: resource[ResourceFQN],
              seq: resource[ResourceSeq],
              props: state!.props,
              state: state!,
              isReplacement: true,
              replace: () => {
                throw new Error(
                  `Resource ${resource[ResourceKind]} ${resource[ResourceFQN]} cannot be replaced in create phase.`,
                );
              },
            });
            return ctx(
              await provider.handler.bind(ctx)(resource[ResourceID], props),
            );
          },
        );
      } else {
        throw error;
      }
    }
    if (!quiet) {
      logger.task(resource[ResourceFQN], {
        prefix:
          phase === "create" ? "created" : isReplaced ? "replaced" : "updated",
        prefixColor: "greenBright",
        resource: formatFQN(resource[ResourceFQN]),
        message: `${phase === "create" ? "Created" : isReplaced ? "Replaced" : "Updated"} Resource`,
        status: "success",
      });
    }

    const status = phase === "create" ? "created" : "updated";
    createAndSendEvent({
      event: "resource.success",
      resource: resource[ResourceKind],
      status,
      phase: scope.phase,
      duration: performance.now() - start,
      replaced: isReplaced,
    });

    state = await scope.state.get(resource[ResourceID]);
    await scope.state.set(resource[ResourceID], {
      kind: resource[ResourceKind],
      id: resource[ResourceID],
      fqn: resource[ResourceFQN],
      seq: resource[ResourceSeq],
      data: state?.data ?? {}, // TODO: this used to be force-unwrapped but that was crashing for me - is this change ok?
      status,
      output,
      props,
    });
    return output as Awaited<Out> & Resource;
  } catch (error) {
    let errorToSend = error instanceof Error ? error : new Error(String(error));
    createAndSendEvent(
      {
        event: "resource.error",
        resource: resource[ResourceKind],
        duration: performance.now() - start,
        phase: scope.phase,
        status: "unknown",
        replaced: false,
      },
      errorToSend,
    );
    scope.fail();
    throw error;
  }
}
