import fs from "node:fs/promises";
import os from "node:os";
import path from "pathe";
import { Lock } from "./util/lock.ts";
import { singleFlight } from "./util/memoize.ts";

namespace Path {
  export const rootDir = path.join(os.homedir(), ".alchemy");
  export const configFile = path.join(rootDir, "config.json");
  export const credentialsDir = path.join(rootDir, "credentials");
  export const credentialsFile = (provider: string, profile: string) =>
    path.join(credentialsDir, profile, `${provider}.json`);
}

interface Props {
  profile: string;
  provider: string;
}

interface Config {
  version: 1;
  profiles: {
    [profile: string]: Profile;
  };
}

namespace Config {
  export const read = async () => {
    const config = await FS.readJSON<Config>(Path.configFile);
    return config ?? { version: 1, profiles: {} };
  };

  export const patch = async (updater: (config: Config) => Config) => {
    const config = await read();
    const updated = updater(config);
    await FS.writeJSON<Config>(Path.configFile, updated);
  };
}

export interface Profile {
  [provider: string]: Provider;
}

export namespace Profile {
  export const get = async (name: string): Promise<Profile | undefined> => {
    const config = await Config.read();
    return config.profiles[name];
  };
}

export interface Provider<
  Metadata extends Record<string, string> = Record<string, string>,
> {
  metadata: Metadata;
  method: "api-key" | "api-token" | "oauth";
  scopes?: string[];
}

export namespace Provider {
  export const get = async <
    Metadata extends Record<string, string> = Record<string, string>,
  >(
    props: Props,
  ) => {
    const profile = await Profile.get(props.profile);
    return profile?.[props.provider] as Provider<Metadata> | undefined;
  };

  export const getWithCredentials = async <
    Metadata extends Record<string, string> = Record<string, string>,
  >(
    props: Props,
  ) => {
    const [provider, credentials] = await Promise.all([
      Provider.get<Metadata>(props),
      Credentials.get(props),
    ]);
    const suffix = props.profile !== "default" ? ` -p ${props.profile}` : "";
    if (!provider) {
      throw new Error(
        `Provider "${props.provider}" not found in profile "${props.profile}". Please run \`alchemy configure${suffix}\` to configure this provider.`,
      );
    }
    if (!credentials) {
      throw new Error(
        `Credentials not found for provider "${props.provider}" and profile "${props.profile}". Please run \`alchemy login ${props.provider}${suffix}\` to login to this provider.`,
      );
    }
    return { provider, credentials };
  };

  export const set = async <
    Metadata extends Record<string, string> = Record<string, string>,
  >(
    props: Props,
    provider: Provider<Metadata>,
  ) => {
    await Config.patch((config) => {
      config.profiles[props.profile] ??= {};
      config.profiles[props.profile][props.provider] = provider;
      return config;
    });
  };

  export const del = async (props: Props) => {
    await Config.patch((config) => {
      if (config.profiles[props.profile]) {
        delete config.profiles[props.profile][props.provider];
      }
      if (Object.keys(config.profiles[props.profile]).length === 0) {
        delete config.profiles[props.profile];
      }
      return config;
    });
  };
}

export type Credentials =
  | Credentials.ApiKey
  | Credentials.ApiToken
  | Credentials.OAuth;

export namespace Credentials {
  export interface ApiKey {
    type: "api-key";
    apiKey: string;
    email: string;
  }

  export interface ApiToken {
    type: "api-token";
    apiToken: string;
  }

  export interface OAuth {
    type: "oauth";
    access: string;
    refresh: string;
    expires: number;
    scopes: string[];
  }

  /**
   * Gets the credentials file.
   * @param props The profile and provider of the credentials.
   */
  export const get = async (props: Props) => {
    return await FS.readJSON<Credentials>(
      Path.credentialsFile(props.provider, props.profile),
    );
  };

  /**
   * Sets the credentials file.
   * @param props The profile and provider of the credentials.
   * @param credentials The credentials to set.
   */
  export const set = async (props: Props, credentials: Credentials) => {
    await FS.writeJSON<Credentials>(
      Path.credentialsFile(props.provider, props.profile),
      credentials,
    );
  };

  /**
   * Deletes the credentials file.
   * @param props The profile and provider of the credentials.
   */
  export const del = async (props: Props) => {
    await fs.unlink(Path.credentialsFile(props.provider, props.profile));
  };

  /**
   * Internal function to fetch and refresh credentials.
   * Uses a lock so the `refresh` function is called by only one process at a time.
   * If another process is refreshing the credentials, this function will wait for the
   * other process to release the lock before calling itself recursively to retrieve the updated credentials.
   */
  const getRefreshedInternal = async (
    props: Props,
    refresh: (credentials: Credentials.OAuth) => Promise<Credentials.OAuth>,
  ): Promise<Credentials> => {
    // 1. Get credentials
    const credentials = await Credentials.get(props);
    if (!credentials) {
      throw new Error(
        `Credentials for provider "${props.provider}" not found in profile "${props.profile}"`,
      );
    }
    // 2. Return credentials if they are not expired
    if (!Credentials.isOAuthExpired(credentials)) {
      return credentials;
    }
    // 3. Refresh credentials with lock for thread safety
    const lock = new Lock(`${props.provider}-${props.profile}`);
    const release = await lock.acquire();
    if (release) {
      try {
        const refreshed = await refresh(credentials);
        await Credentials.set(props, refreshed);
        return refreshed;
      } finally {
        await release();
      }
    }
    // 4. Another process has the lock, so wait for it to be released
    await lock.wait();
    // 5. Call this function again, bypassing the single flight mechanism to avoid a deadlock
    return await getRefreshedInternal(props, refresh);
  };

  /**
   * Fetches OAuth credentials for the given provider and profile, refreshing them if they are expired.
   * @param props The properties of the credentials.
   * @param refresh The function to refresh the credentials.
   * @returns The refreshed credentials.
   */
  export const getRefreshed = singleFlight(
    // The locking mechanism works within the same process, but since the lock uses IO and polling,
    // wrapping it with `singleFlight` makes it more efficient.
    getRefreshedInternal,
    (props) => `${props.provider}-${props.profile}`,
  );

  /**
   * Returns true if the given credentials are OAuth and expired.
   */
  export const isOAuthExpired = (
    credentials: Credentials,
    tolerance = 1000 * 10,
  ): credentials is Credentials.OAuth => {
    return (
      credentials.type === "oauth" &&
      credentials.expires < Date.now() + tolerance
    );
  };
}

namespace FS {
  export const readJSON = async <T>(path: string): Promise<T | undefined> => {
    try {
      const data = await fs.readFile(path, "utf-8");
      return JSON.parse(data) as T;
    } catch {
      return undefined;
    }
  };

  export const writeJSON = async <T>(name: string, data: T) => {
    await fs.mkdir(path.dirname(name), { recursive: true });
    await fs.writeFile(name, JSON.stringify(data, null, 2), { mode: 0o600 });
  };
}
