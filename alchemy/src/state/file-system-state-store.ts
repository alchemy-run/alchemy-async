import fs from "node:fs";
import path from "pathe";
import { ResourceScope } from "../resource.ts";
import type { Scope } from "../scope.ts";
import { deserialize, serialize } from "../serde.ts";
import type { State, StateStore } from "../state.ts";
import { ignore } from "../util/ignore.ts";

const ALCHEMY_SEPERATOR_CHAR = process.platform === "win32" ? "-" : ":";

export class FileSystemStateStore implements StateStore {
  public readonly dir: string;
  private initialized = false;
  constructor(
    public readonly scope: Scope,
    options?: {
      rootDir?: string;
    },
  ) {
    this.dir = path.join(options?.rootDir ?? scope.dotAlchemy, ...scope.chain);
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    await fs.promises.mkdir(this.dir, { recursive: true });
  }

  async deinit(): Promise<void> {
    await ignore("ENOENT", async () => {
      const entries = await fs.promises.readdir(this.dir, {
        withFileTypes: true,
      });
      const files = entries.filter((entry) => entry.isFile());
      if (files.length > 0) {
        throw new Error(
          `Cannot deinit: directory "${this.dir}" contains files and cannot be deleted.`,
        );
      }
      // Only folders (or empty), delete recursively
      await fs.promises.rm(this.dir, { recursive: true, force: true });
    });
  }

  async count(): Promise<number> {
    return Object.keys(await this.list()).length;
  }

  async list(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.dir, {
        withFileTypes: true,
      });
      return files
        .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".json"))
        .map((dirent) => dirent.name.replace(/\.json$/, ""))
        .map((key) => key.replaceAll(":", "/"));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async get(key: string): Promise<State | undefined> {
    try {
      const content = await fs.promises.readFile(this.getPath(key), "utf8");
      const state = (await deserialize(
        this.scope,
        JSON.parse(content),
      )) as State;
      if (state.output === undefined) {
        state.output = {} as any;
      }
      state.output[ResourceScope] = this.scope;
      return state;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  async set(key: string, value: State): Promise<void> {
    await this.init();
    const file = this.getPath(key);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(
      file,
      JSON.stringify(await serialize(this.scope, value), null, 2),
    );
  }

  async delete(key: string): Promise<void> {
    try {
      return await fs.promises.unlink(this.getPath(key));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }

  async all(): Promise<Record<string, State>> {
    return this.getBatch(await this.list());
  }

  async getBatch(ids: string[]): Promise<Record<string, State>> {
    return Object.fromEntries(
      (
        await Promise.all(
          Array.from(ids).flatMap(async (id) => {
            const s = await this.get(id);
            if (s === undefined) {
              return [] as const;
            }
            return [[id, s]] as const;
          }),
        )
      ).flat(),
    );
  }

  private getPath(key: string): string {
    if (key.includes(":")) {
      throw new Error(`ID cannot include colons: ${key}`);
    }
    if (key.includes("/")) {
      //todo(michael): remove this next time we do a breaking change
      //* windows doesn't support ":" in file paths, but we already use ":"
      //* so now we use both to prevent breaking changes
      key = key.replaceAll("/", ALCHEMY_SEPERATOR_CHAR);
    }
    //todo(michael): remove this next time we do a breaking change
    //* windows doesn't support "*" in file paths, but we already use "*"
    //* when making cloudflare routes containing "*"
    //* so now we use "+" on windows but "*" on mac/linux to prevent breaking changes
    if (process.platform === "win32") {
      key = key.replaceAll("*", "+");
    }
    return path.join(this.dir, `${key}.json`);
  }
}
