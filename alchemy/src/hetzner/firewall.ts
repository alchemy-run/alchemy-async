import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { createHetznerApi, type HetznerApiOptions } from "./api.ts";

/**
 * A single firewall rule
 */
export interface FirewallRule {
  /**
   * Traffic direction this rule applies to
   */
  direction: "in" | "out";

  /**
   * Network protocol
   */
  protocol: "tcp" | "udp" | "icmp" | "esp" | "gre";

  /**
   * Port or port range (e.g. "80", "443", "8000-9000").
   * Omit for icmp, esp, and gre protocols.
   */
  port?: string;

  /**
   * Source IP CIDR list for inbound rules
   */
  sourceIps?: string[];

  /**
   * Destination IP CIDR list for outbound rules
   */
  destinationIps?: string[];

  /**
   * Human-readable description of the rule
   */
  description?: string;
}

/**
 * Properties for creating or updating a Hetzner Firewall
 */
export interface FirewallProps extends HetznerApiOptions {
  /**
   * Name of the firewall
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Firewall rules. Rules are replaced wholesale on update.
   */
  rules: FirewallRule[];

  /**
   * User-defined labels (key/value pairs)
   */
  labels?: Record<string, string>;

  /**
   * Adopt an existing firewall with the same name instead of failing
   * @default false
   */
  adopt?: boolean;
}

/**
 * Output type for a managed Hetzner Firewall
 */
export type Firewall = Omit<FirewallProps, "adopt"> & {
  /**
   * Numeric ID assigned by Hetzner
   */
  id: number;

  /**
   * Name of the firewall (always present after creation)
   */
  name: string;

  /**
   * ISO 8601 timestamp of when the firewall was created
   */
  created: string;
};

/**
 * Type guard for Firewall resources
 */
export function isFirewall(resource: any): resource is Firewall {
  return resource?.[ResourceKind] === "hetzner::Firewall";
}

/** @internal */
interface HetznerFirewallRule {
  direction: "in" | "out";
  protocol: "tcp" | "udp" | "icmp" | "esp" | "gre";
  port?: string;
  source_ips?: string[];
  destination_ips?: string[];
  description?: string;
}

/** @internal */
interface HetznerFirewallResponse {
  firewall: {
    id: number;
    name: string;
    created: string;
    labels: Record<string, string>;
    rules: HetznerFirewallRule[];
  };
}

/** @internal */
interface HetznerFirewallListResponse {
  firewalls: HetznerFirewallResponse["firewall"][];
}

function toApiRule(rule: FirewallRule): HetznerFirewallRule {
  const apiRule: HetznerFirewallRule = {
    direction: rule.direction,
    protocol: rule.protocol,
  };
  if (rule.port !== undefined) apiRule.port = rule.port;
  if (rule.sourceIps !== undefined) apiRule.source_ips = rule.sourceIps;
  if (rule.destinationIps !== undefined)
    apiRule.destination_ips = rule.destinationIps;
  if (rule.description !== undefined) apiRule.description = rule.description;
  return apiRule;
}

function fromApiRule(rule: HetznerFirewallRule): FirewallRule {
  const r: FirewallRule = {
    direction: rule.direction,
    protocol: rule.protocol,
  };
  if (rule.port !== undefined) r.port = rule.port;
  if (rule.source_ips !== undefined) r.sourceIps = rule.source_ips;
  if (rule.destination_ips !== undefined)
    r.destinationIps = rule.destination_ips;
  if (rule.description !== undefined) r.description = rule.description;
  return r;
}

/**
 * Create and manage a Hetzner Cloud Firewall.
 *
 * Firewalls control inbound and outbound traffic for Hetzner Cloud Servers.
 * Rules are replaced wholesale on update via the `set_rules` action endpoint.
 *
 * @see https://docs.hetzner.cloud/#firewalls
 *
 * @example
 * ## Basic web server firewall
 *
 * Allow HTTP and HTTPS inbound traffic plus all outbound.
 *
 * ```ts
 * const firewall = await Firewall("web-firewall", {
 *   rules: [
 *     { direction: "in", protocol: "tcp", port: "80", sourceIps: ["0.0.0.0/0", "::/0"] },
 *     { direction: "in", protocol: "tcp", port: "443", sourceIps: ["0.0.0.0/0", "::/0"] },
 *     { direction: "out", protocol: "tcp", port: "1-65535", destinationIps: ["0.0.0.0/0", "::/0"] },
 *   ],
 * });
 * ```
 *
 * @example
 * ## SSH access firewall with labels
 *
 * Restrict SSH access to a known CIDR.
 *
 * ```ts
 * const firewall = await Firewall("ssh-firewall", {
 *   name: "ssh-only",
 *   rules: [
 *     { direction: "in", protocol: "tcp", port: "22", sourceIps: ["10.0.0.0/8"] },
 *   ],
 *   labels: { env: "prod", team: "ops" },
 * });
 * ```
 */
export const Firewall = Resource(
  "hetzner::Firewall",
  async function (
    this: Context<Firewall>,
    id: string,
    props: FirewallProps,
  ): Promise<Firewall> {
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const adopt = props.adopt ?? this.scope.adopt ?? false;

    if (this.scope.local) {
      return {
        ...props,
        id: 0,
        name,
        created: new Date().toISOString(),
      };
    }

    const api = createHetznerApi({
      apiToken: props.apiToken,
      baseUrl: props.baseUrl,
    });

    if (this.phase === "delete") {
      if (this.output?.id) {
        await api.delete(`/firewalls/${this.output.id}`);
      }
      return this.destroy();
    }

    const rules = props.rules.map(toApiRule);

    if (this.phase === "update" && this.output?.id) {
      const firewallId = this.output.id;

      // Update name and labels if changed
      if (
        name !== this.output.name ||
        JSON.stringify(props.labels ?? {}) !==
          JSON.stringify(this.output.labels ?? {})
      ) {
        await api.put(`/firewalls/${firewallId}`, {
          name,
          labels: props.labels ?? {},
        });
      }

      // Replace rules wholesale
      await api.post(`/firewalls/${firewallId}/actions/set_rules`, { rules });

      return {
        ...props,
        id: firewallId,
        name,
        created: this.output.created,
      };
    }

    // Create
    try {
      const result = await api.post<HetznerFirewallResponse>("/firewalls", {
        name,
        rules,
        labels: props.labels ?? {},
      });

      return {
        ...props,
        id: result.firewall.id,
        name: result.firewall.name,
        created: result.firewall.created,
        rules: result.firewall.rules.map(fromApiRule),
        labels: result.firewall.labels,
      };
    } catch (error: any) {
      if (error?.code === "uniqueness_error" || error?.status === 409) {
        if (!adopt) {
          throw new Error(
            `Firewall "${name}" already exists. Use adopt: true to adopt it.`,
            { cause: error },
          );
        }

        // Find by name and adopt
        const list = await api.get<HetznerFirewallListResponse>(
          `/firewalls?name=${encodeURIComponent(name)}`,
        );

        const existing = list.firewalls.find((f) => f.name === name);
        if (!existing) {
          throw new Error(
            `Firewall "${name}" could not be found for adoption.`,
            { cause: error },
          );
        }

        // Replace rules on adopted firewall
        await api.post(`/firewalls/${existing.id}/actions/set_rules`, {
          rules,
        });

        return {
          ...props,
          id: existing.id,
          name: existing.name,
          created: existing.created,
          rules: props.rules,
          labels: props.labels ?? existing.labels,
        };
      }
      throw error;
    }
  },
);
