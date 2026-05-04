import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { State, StateStore } from "../state.ts";
import { assertNever } from "../util/assert-never.ts";
import type { StateStoreProxy } from "./proxy.ts";
import * as schema from "./schema.ts";

const { scope: _, ...columns } = getTableColumns(schema.resources);

type Database = BaseSQLiteDatabase<any, any, typeof schema>;

/**
 * Represents the SQL operations for a SQLite-backed state store.
 * DOES NOT include serialization/deserialization — that is handled by the `StateStoreProxy` class.
 */
export class SQLiteStateStoreOperations implements StateStore {
  constructor(
    private readonly db: Database,
    private readonly context: { chain: string[] },
  ) {}

  async dispatch<TMethod extends StateStoreProxy.Method>(
    method: TMethod,
    params: StateStoreProxy.API[TMethod]["params"],
  ): Promise<StateStoreProxy.API[TMethod]["result"]> {
    switch (method) {
      case "init":
        return;
      case "deinit":
        return;
      case "list":
        return this.list();
      case "listScopes":
        return this.listScopes();
      case "count":
        return this.count();
      case "get": {
        const [key] = params as StateStoreProxy.API["get"]["params"];
        return this.get(key);
      }
      case "getBatch": {
        const [keys] = params as StateStoreProxy.API["getBatch"]["params"];
        return this.getBatch(keys);
      }
      case "all":
        return this.all();
      case "set": {
        const [key, state] = params as StateStoreProxy.API["set"]["params"];
        return this.set(key, state);
      }
      case "delete": {
        const [key] = params as StateStoreProxy.API["delete"]["params"];
        return this.delete(key);
      }
      default:
        assertNever(method);
    }
  }

  async list() {
    const result = await this.db
      .select({ id: schema.resources.id })
      .from(schema.resources)
      .where(eq(schema.resources.scope, this.context.chain));
    return result.map((r) => r.id);
  }
  async listScopes() {
    const rows = await this.db
      .selectDistinct({ scope: schema.resources.scope })
      .from(schema.resources);
    const prefix = this.context.chain;
    const names = new Set<string>();
    for (const row of rows) {
      const scope = row.scope as string[];
      if (scope.length !== prefix.length + 1) continue;
      let matches = true;
      for (let i = 0; i < prefix.length; i++) {
        if (scope[i] !== prefix[i]) {
          matches = false;
          break;
        }
      }
      if (matches) names.add(scope[prefix.length]!);
    }
    return [...names];
  }
  async count() {
    const result = await this.db.$count(
      this.db
        .select()
        .from(schema.resources)
        .where(eq(schema.resources.scope, this.context.chain)),
    );
    return result;
  }
  async get(key: string) {
    const [result] = await this.db
      .select(columns)
      .from(schema.resources)
      .where(
        and(
          eq(schema.resources.scope, this.context.chain),
          eq(schema.resources.id, key),
        ),
      );
    if (!result) {
      return undefined;
    }
    return {
      ...result,
      props: result.props ?? undefined,
      oldProps: result.oldProps ?? undefined,
    };
  }
  async all() {
    const result = await this.db
      .select(columns)
      .from(schema.resources)
      .where(eq(schema.resources.scope, this.context.chain));
    const record: Record<string, State> = {};
    for (const r of result) {
      record[r.id] = {
        ...r,
        props: r.props ?? undefined,
        oldProps: r.oldProps ?? undefined,
      };
    }
    return record;
  }
  async set(_key: string, state: State) {
    await this.db
      .insert(schema.resources)
      .values({
        ...state,
        scope: this.context.chain,
      })
      .onConflictDoUpdate({
        target: [schema.resources.id, schema.resources.scope],
        set: {
          ...state,
        },
      });
  }
  async delete(key: string) {
    await this.db
      .delete(schema.resources)
      .where(
        and(
          eq(schema.resources.scope, this.context.chain),
          eq(schema.resources.id, key),
        ),
      );
  }
  async getBatch(keys: string[]) {
    const result = await this.db
      .select(columns)
      .from(schema.resources)
      .where(
        and(
          eq(schema.resources.scope, this.context.chain),
          inArray(schema.resources.id, keys),
        ),
      );
    const record: Record<string, State> = {};
    for (const r of result) {
      record[r.id] = {
        ...r,
        props: r.props ?? undefined,
        oldProps: r.oldProps ?? undefined,
      };
    }
    return record;
  }
}
