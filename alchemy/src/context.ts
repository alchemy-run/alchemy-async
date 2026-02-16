import { DestroyedSignal } from "./destroy.ts";
import {
  ResourceFQN,
  ResourceID,
  ResourceKind,
  ResourceScope,
  ResourceSeq,
  type Resource,
  type ResourceAttributes,
  type ResourceProps,
} from "./resource.ts";
import type { Scope } from "./scope.ts";
import type { State } from "./state.ts";

export type Context<
  Out extends ResourceAttributes,
  Props extends ResourceProps = ResourceProps,
> = CreateContext<Out> | UpdateContext<Out, Props> | DeleteContext<Out, Props>;

export interface CreateContext<
  Out extends ResourceAttributes,
> extends BaseContext<Out> {
  phase: "create";
  output?: undefined;
  props?: undefined;
}

export interface UpdateContext<
  Out extends ResourceAttributes,
  Props extends ResourceProps = ResourceProps,
> extends BaseContext<Out> {
  phase: "update";
  output: Out;
  props: Props;
}

export interface DeleteContext<
  Out extends ResourceAttributes,
  Props extends ResourceProps = ResourceProps,
> extends BaseContext<Out> {
  phase: "delete";
  output: Out;
  props: Props;
}

export interface BaseContext<Out extends ResourceAttributes> {
  quiet: boolean;
  stage: string;
  id: ResourceID;
  fqn: ResourceFQN;
  scope: Scope;
  /**
   * Indicates whether this resource is being created as a replacement for another resource
   */
  isReplacement: boolean;
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete<T>(key: string): Promise<T | undefined>;
  /**
   * Indicate that this resource is being replaced.
   * This will cause the resource to be deleted at the end of the stack's CREATE phase.
   */
  replace(force?: boolean): never;
  /**
   * Terminate the resource lifecycle handler and destroy the resource.
   *
   * This is the final operation performed during a delete operation.
   *
   * It is so that the resource lifecycle handler can "return never" instead of
   * "return undefined" so that `await MyResource()` always returns a value.
   *
   * @param retainChildren - Whether to retain the children of the resource.
   */
  destroy(retainChildren?: boolean): never;
  /**
   * Register a cleanup function that will be called when the process exits.
   *
   * @example
   * const proc = spawn('my-command', ['arg1', 'arg2']);
   * this.onCleanup(async () => {
   *   proc.kill();
   *   await waitForExit(proc);
   * });
   */
  onCleanup(fn: () => void | Promise<void>): void;
  /**
   * Create the Resource envelope (with Alchemy + User properties)
   */
  create(props: Omit<Out, keyof Resource>): Out;
  /**
   * Create the Resource envelope (with Alchemy + User properties)
   */
  (id: string, props: Omit<Out, keyof Resource>): Out;
  (props: Omit<Out, keyof Resource>): Out;
}

export function context<
  Kind extends string,
  Props extends ResourceProps | undefined,
  Out extends ResourceAttributes,
>({
  scope,
  phase,
  kind,
  id,
  fqn,
  seq,
  state,
  replace,
  props,
  isReplacement = false,
}: {
  scope: Scope;
  phase: "create" | "update" | "delete";
  kind: ResourceKind;
  id: ResourceID;
  fqn: ResourceFQN;
  seq: number;
  props: Props;
  state: State<Kind, Props, Out & Resource>;
  replace: (force?: boolean) => never;
  isReplacement?: boolean;
}): Context<Out> {
  type InternalSymbols =
    | typeof ResourceID
    | typeof ResourceKind
    | typeof ResourceFQN
    | typeof ResourceSeq
    | typeof ResourceScope;
  function create(props: Omit<Out, InternalSymbols>): Out;
  function create(id: string, props: Omit<Out, InternalSymbols>): Out;
  function create(
    ...args:
      | [props: Omit<Out, InternalSymbols>]
      | [id: string, props: Omit<Out, InternalSymbols>]
  ): Out {
    const [ID, props] =
      typeof args[0] === "string" ? (args as [string, any]) : [id, args[0]];

    return {
      ...props,
      [ResourceKind]: kind,
      [ResourceID]: ID,
      [ResourceFQN]: fqn,
      [ResourceScope]: scope,
      [ResourceSeq]: seq,
    } as Out;
  }
  return Object.assign(create, {
    stage: scope.stage,
    scope,
    id: id,
    fqn: fqn,
    phase,
    output: state.output,
    props,
    replace,
    isReplacement,
    get: (key: string) => state.data[key],
    set: async (key: string, value: any) => {
      state.data[key] = value;
    },
    delete: async (key: string) => {
      const value = state.data[key];
      delete state.data[key];
      return value;
    },
    quiet: scope.quiet,
    destroy: (retainChildren = false) => {
      throw new DestroyedSignal(retainChildren);
    },
    onCleanup: (fn: () => void | Promise<void>) => {
      // make the function idempotent so repeated calls don't cause the process to hang
      let promise: Promise<void> | undefined;
      scope.root.onCleanup(async () => {
        promise ??= Promise.resolve(fn());
        await promise;
      });
    },
    create,
  }) as unknown as Context<Out>;
}
