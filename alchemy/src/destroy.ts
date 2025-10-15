import { alchemy } from "./alchemy.ts";
import { context } from "./context.ts";
import {
  resolveDeletionHandler,
  type Resource,
  ResourceFQN,
  ResourceID,
  ResourceKind,
  type ResourceProps,
  ResourceScope,
  ResourceSeq,
} from "./resource.ts";
import { isScope, type PendingDeletions, Scope } from "./scope.ts";
import type { State } from "./state.ts";
import { formatFQN } from "./util/cli.ts";
import { logger } from "./util/logger.ts";
import { createAndSendEvent } from "./util/telemetry.ts";

export function isDestroyedSignal(error: any): error is DestroyedSignal {
  return error instanceof Error && (error as any).kind === "DestroyedSignal";
}

export class DestroyedSignal extends Error {
  readonly kind = "DestroyedSignal";
  constructor(public readonly noop: boolean) {
    super();
  }
}

export type DestroyStrategy = "sequential" | "parallel";

export const DestroyStrategy = Symbol.for("alchemy::DestroyStrategy");

export interface DestroyOptions {
  quiet?: boolean;
  strategy?: DestroyStrategy;
  replace?: {
    props?: ResourceProps | undefined;
    output?: Resource<string>;
  };
  /**
   * If true, children of the resource will not be destroyed (but their state will be deleted).
   */
  noop?: boolean;
}

function isScopeArgs(a: any): a is [scope: Scope, options?: DestroyOptions] {
  return isScope(a[0]);
}

/**
 * Prune all resources from an Output and "down", i.e. that branches from it.
 */
export async function destroy(
  ...args:
    | [scope: Scope, options?: DestroyOptions]
    | [resource: any | undefined | null, options?: DestroyOptions]
): Promise<void> {
  if (isScopeArgs(args)) {
    const [scope] = args;
    const options = {
      strategy: scope.destroyStrategy ?? "sequential",
      ...(args[1] ?? {}),
    } satisfies DestroyOptions;

    await scope.run(async () => {
      // destroy all active and pending resources
      await scope.destroyPendingDeletions();
      await destroyAll(Array.from(scope.resources.values()), options);

      // then detect orphans and destroy them
      const orphans = await scope.state.all();
      await destroyAll(
        Object.values(orphans).map((orphan) => ({
          ...orphan.output,
          Scope: scope,
        })),
        options,
      );
    });

    // finally, destroy the scope container
    await scope.deinit();
    return;
  }

  const [instance, options] = args;

  if (!instance) {
    return;
  }

  if (instance[ResourceKind] === Scope.KIND) {
    const scope = new Scope({
      parent: instance[ResourceScope],
      scopeName: instance[ResourceID],
    });
    return await destroy(scope, options);
  }

  const Provider = resolveDeletionHandler(instance[ResourceKind]);
  if (!Provider) {
    throw new Error(
      `Cannot destroy resource "${instance[ResourceFQN]}" type ${instance[ResourceKind]} - no provider found. You may need to import the provider in your alchemy.run.ts.`,
    );
  }

  const scope = instance[ResourceScope];
  if (!scope) {
    logger.warn(`Resource "${instance[ResourceFQN]}" has no scope`);
  }
  const quiet = options?.quiet ?? scope.quiet;
  const start = performance.now();

  try {
    if (!quiet && !options?.noop) {
      logger.task(instance[ResourceFQN], {
        prefix: options?.replace ? "cleanup" : "deleting",
        prefixColor: options?.replace ? "magenta" : "redBright",
        resource: formatFQN(instance[ResourceFQN]),
        message: options?.replace
          ? "Cleaning Up Old Resource..."
          : "Deleting Resource...",
      });
    }

    await createAndSendEvent({
      event: "resource.start",
      resource: instance[ResourceKind],
      status: "deleting",
      phase: "destroy",
      duration: performance.now() - start,
      replaced: !!options?.replace,
    });

    let state: State;
    let props: ResourceProps | undefined;
    if (options?.replace) {
      props = options.replace.props;
      state = {
        output: options.replace.output!,
        status: "deleting",
        oldProps: options.replace.props,
        data: {},
        kind: instance[ResourceKind],
        id: instance[ResourceID],
        fqn: instance[ResourceFQN],
        seq: instance[ResourceSeq],
        props,
      };
    } else {
      const _state = await scope.state.get(instance[ResourceID]);
      if (_state === undefined) {
        return;
      }
      state = _state;
      props = state.props;
    }
    const ctx = context({
      scope,
      phase: "delete",
      kind: instance[ResourceKind],
      id: instance[ResourceID],
      fqn: instance[ResourceFQN],
      seq: instance[ResourceSeq],
      props,
      state,
      // TODO(sam|michael): should this always be false or !!options?.replace
      isReplacement: false,
      replace: () => {
        throw new Error("Cannot replace a resource that is being deleted");
      },
    });

    let nestedScope: Scope | undefined;
    let noop = options?.noop ?? false;

    try {
      // BUG: this does not restore persisted scope
      await alchemy.run(
        instance[ResourceID],
        {
          // TODO(sam): this is an awful hack to differentiate between naked scopes and resources
          isResource: instance[ResourceKind] !== "alchemy::Scope",
          parent: scope,
          destroyStrategy: instance[DestroyStrategy] ?? "sequential",
          noop,
        },
        async (scope) => {
          nestedScope = options?.replace?.props == null ? scope : undefined;
          if (noop) {
            return ctx.destroy(noop);
          }
          return Provider.handler.bind(ctx)(instance[ResourceID], ctx.props);
        },
      );
    } catch (err) {
      if (isDestroyedSignal(err)) {
        noop = noop || err.noop;
        // TODO: should we fail if the DestroyedSignal is not thrown?
      } else {
        throw err;
      }
    }

    if (nestedScope) {
      await destroy(nestedScope, {
        ...options,
        noop,
        strategy: instance[DestroyStrategy] ?? "sequential",
      });
    }

    if (options?.replace == null) {
      await scope.deleteResource(instance[ResourceID]);
    } else {
      let pendingDeletions =
        await state.output[ResourceScope].get<PendingDeletions>(
          "pendingDeletions",
        );
      pendingDeletions = pendingDeletions?.filter(
        (deletion) => deletion.resource[ResourceID] !== instance[ResourceID],
      );
      await scope.set("pendingDeletions", pendingDeletions);
    }

    if (!quiet && !options?.noop) {
      logger.task(instance[ResourceFQN], {
        prefix: options?.replace ? "cleaned" : "deleted",
        prefixColor: "greenBright",
        resource: formatFQN(instance[ResourceFQN]),
        message: options?.replace
          ? "Old Resource Cleanup Complete"
          : "Deleted Resource",
        status: "success",
      });
    }

    await createAndSendEvent({
      event: "resource.success",
      resource: instance[ResourceKind],
      status: "deleted",
      phase: "destroy",
      duration: performance.now() - start,
      replaced: !!options?.replace,
    });
  } catch (error) {
    let errorToSend = error instanceof Error ? error : new Error(String(error));
    await createAndSendEvent(
      {
        event: "resource.error",
        resource: instance[ResourceKind],
        duration: performance.now() - start,
        phase: "destroy",
        status: "deleting",
        replaced: !!options?.replace,
      },
      errorToSend,
    );
    logger.error(error);
    throw error;
  }
}

export async function destroyAll(
  resources: Resource[],
  options?: DestroyOptions & { force?: boolean },
) {
  if (options?.strategy !== "parallel") {
    const sorted = resources.sort((a, b) => b[ResourceSeq] - a[ResourceSeq]);
    for (const resource of sorted) {
      if (isScope(resource)) {
        await resource.destroyPendingDeletions();
      }
      await destroy(resource, options);
    }
  } else {
    await Promise.all(resources.map((resource) => destroy(resource, options)));
  }
}
