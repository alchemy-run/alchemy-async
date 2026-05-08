import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { createHetznerApi, type HetznerApiOptions } from "./api.ts";

/**
 * Properties for creating or updating a Hetzner SSH Key
 */
export interface SSHKeyProps extends HetznerApiOptions {
  /**
   * Name of the SSH key
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * The SSH public key content
   */
  publicKey: string;

  /**
   * User-defined labels attached to the SSH key
   */
  labels?: Record<string, string>;

  /**
   * Whether to adopt an existing SSH key with the same name if it exists
   *
   * @default false
   */
  adopt?: boolean;
}

/**
 * A Hetzner Cloud SSH Key resource
 */
export type SSHKey = Omit<SSHKeyProps, "adopt"> & {
  /**
   * The Hetzner-assigned numeric ID of the SSH key
   */
  id: number;

  /**
   * The name of the SSH key (always set on output)
   */
  name: string;

  /**
   * The fingerprint of the SSH key
   */
  fingerprint: string;

  /**
   * ISO 8601 timestamp of when the SSH key was created
   */
  created: string;
};

interface HetznerSSHKeyResponse {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  labels: Record<string, string>;
  created: string;
}

/**
 * Creates a Hetzner Cloud SSH Key.
 *
 * @example
 * ## Upload an SSH key
 *
 * Upload a public key to Hetzner for use when creating servers.
 *
 * ```ts
 * const key = await SSHKey("my-key", {
 *   publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...",
 * });
 * console.log(key.fingerprint); // e.g. "b7:31:..."
 * ```
 *
 * @example
 * ## Upload an SSH key with labels
 *
 * ```ts
 * const key = await SSHKey("deploy-key", {
 *   name: "deploy-key-prod",
 *   publicKey: process.env.SSH_PUBLIC_KEY!,
 *   labels: { env: "prod", team: "infra" },
 * });
 * ```
 */
export const SSHKey = Resource(
  "hetzner::SSHKey",
  async function (
    this: Context<SSHKey>,
    id: string,
    props: SSHKeyProps,
  ): Promise<SSHKey> {
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      return {
        ...props,
        id: 0,
        name,
        fingerprint: "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00",
        created: new Date().toISOString(),
      };
    }

    const api = await createHetznerApi(props);

    if (this.phase === "delete") {
      if (this.output?.id) {
        try {
          await api.delete(`/ssh_keys/${this.output.id}`);
        } catch (error) {
          logger.error(`Error deleting SSH key '${name}':`, error);
        }
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output?.id) {
      // publicKey is immutable in Hetzner — trigger replacement if it changed
      if (props.publicKey !== this.output.publicKey) {
        return this.replace();
      }

      const { ssh_key }: { ssh_key: HetznerSSHKeyResponse } = (await api.put(
        `/ssh_keys/${this.output.id}`,
        {
          name,
          labels: props.labels ?? {},
        },
      )) as any;
      return toOutput(props, ssh_key);
    }

    // Create
    try {
      const { ssh_key }: { ssh_key: HetznerSSHKeyResponse } = (await api.post(
        "/ssh_keys",
        {
          name,
          public_key: props.publicKey,
          labels: props.labels ?? {},
        },
      )) as any;
      return toOutput(props, ssh_key);
    } catch (error: any) {
      if (error?.code === "uniqueness_error" || error?.status === 422) {
        if (!props.adopt) {
          throw new Error(
            `SSH key '${name}' already exists. Use adopt: true to adopt it.`,
          );
        }

        // Find and adopt the existing key by listing all keys
        const { ssh_keys }: { ssh_keys: HetznerSSHKeyResponse[] } =
          (await api.get("/ssh_keys")) as any;
        const existing = ssh_keys.find((k) => k.name === name);
        if (!existing) {
          throw new Error(
            `SSH key '${name}' was not found for adoption despite conflict error.`,
          );
        }

        // Update the adopted key to sync labels
        const { ssh_key }: { ssh_key: HetznerSSHKeyResponse } = (await api.put(
          `/ssh_keys/${existing.id}`,
          {
            name,
            labels: props.labels ?? {},
          },
        )) as any;
        return toOutput(props, ssh_key);
      }

      throw error;
    }
  },
);

function toOutput(props: SSHKeyProps, key: HetznerSSHKeyResponse): SSHKey {
  return {
    ...props,
    id: key.id,
    name: key.name,
    fingerprint: key.fingerprint,
    publicKey: key.public_key,
    labels: key.labels,
    created: key.created,
  };
}

/**
 * Type guard that checks whether a value is a Hetzner SSHKey resource.
 */
export function isSSHKey(r: any): r is SSHKey {
  return r?.[ResourceKind] === "hetzner::SSHKey";
}
