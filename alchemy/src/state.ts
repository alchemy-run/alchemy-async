import type { Resource, ResourceProps } from "./resource.ts";
import type { Scope } from "./scope.ts";

export type State<
  Kind extends string = string,
  Props extends ResourceProps | undefined = ResourceProps | undefined,
  Out extends Resource = Resource,
> = {
  status:
    | `creating`
    | `created`
    | `updating`
    | `updated`
    | `deleting`
    | `deleted`;
  kind: Kind;
  id: string;
  fqn: string;
  seq: number;
  data: Record<string, any>;
  // deps: string[];
  props: Props;
  oldProps?: Props;
  output: Out;
};

export type StateStoreType = (scope: Scope) => StateStore;

export interface StateStore {
  /** Initialize the state container if one is required */
  init?(): Promise<void>;
  /** Delete the state container if one exists */
  deinit?(): Promise<void>;
  /** List all resources in the given stage. */
  list(): Promise<string[]>;
  /** Return the number of items let in this store */
  count(): Promise<number>;
  get(key: string): Promise<State | undefined>;
  getBatch(ids: string[]): Promise<Record<string, State>>;
  all(): Promise<Record<string, State>>;
  set(key: string, value: State): Promise<void>;
  delete(key: string): Promise<void>;
  /** List names of nested scopes within this scope, if supported. */
  listScopes?(): Promise<string[]>;
}
