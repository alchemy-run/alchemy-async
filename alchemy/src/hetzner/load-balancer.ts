import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { poll } from "../util/poll.ts";
import { createHetznerApi, type HetznerApiOptions } from "./api.ts";

/** Minimal shape needed from a Network resource reference */
export interface NetworkRef {
  id: number;
}

/** Minimal shape needed from a Server resource reference */
export interface ServerRef {
  id: number;
}

export interface LBService {
  protocol: "http" | "https" | "tcp";
  listenPort: number;
  destinationPort: number;
  proxyprotocol?: boolean;
  http?: {
    redirectHttp?: boolean;
    stickySessionsCookieName?: string;
    certificates?: number[];
  };
  healthCheck?: {
    protocol: "http" | "tcp";
    port: number;
    interval?: number;
    timeout?: number;
    retries?: number;
    http?: {
      path?: string;
      statusCodes?: string[];
      tls?: boolean;
    };
  };
}

export interface LBTarget {
  type: "server" | "label_selector" | "ip";
  server?: string | ServerRef;
  labelSelector?: string;
  ip?: string;
  usePrivateIp?: boolean;
}

export interface LoadBalancerProps extends HetznerApiOptions {
  name?: string;
  loadBalancerType: string;
  /** IMMUTABLE — triggers replace on change */
  location?: string;
  network?: string | NetworkRef;
  services: LBService[];
  targets: LBTarget[];
  labels?: Record<string, string>;
  publicInterface?: boolean;
  adopt?: boolean;
}

export type LoadBalancer = Omit<LoadBalancerProps, "adopt"> & {
  id: number;
  name: string;
  publicNet: { ipv4: { ip: string }; ipv6: { ip: string } };
  privateNet: { networkId: number; ip: string }[];
  created: string;
};

export function isLoadBalancer(resource: any): resource is LoadBalancer {
  return resource?.[ResourceKind] === "hetzner::LoadBalancer";
}

function resolveNetworkId(
  network: string | NetworkRef | undefined,
): number | undefined {
  if (!network) return undefined;
  if (typeof network === "string") return Number(network);
  return network.id;
}

function resolveServerId(
  server: string | ServerRef | undefined,
): number | undefined {
  if (!server) return undefined;
  if (typeof server === "string") return Number(server);
  return server.id;
}

function serviceKey(svc: LBService): string {
  return `${svc.listenPort}`;
}

function targetKey(t: LBTarget): string {
  if (t.type === "server") return `server:${resolveServerId(t.server)}`;
  if (t.type === "label_selector") return `label_selector:${t.labelSelector}`;
  return `ip:${t.ip}`;
}

function buildServicePayload(svc: LBService): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    protocol: svc.protocol,
    listen_port: svc.listenPort,
    destination_port: svc.destinationPort,
    proxyprotocol: svc.proxyprotocol ?? false,
  };

  if (svc.http) {
    payload.http = {
      redirect_http: svc.http.redirectHttp ?? false,
      sticky_sessions: svc.http.stickySessionsCookieName
        ? { enabled: true, cookie_name: svc.http.stickySessionsCookieName }
        : { enabled: false },
      certificates: svc.http.certificates ?? [],
    };
  }

  if (svc.healthCheck) {
    const hc: Record<string, unknown> = {
      protocol: svc.healthCheck.protocol,
      port: svc.healthCheck.port,
      interval: svc.healthCheck.interval ?? 15,
      timeout: svc.healthCheck.timeout ?? 10,
      retries: svc.healthCheck.retries ?? 3,
    };
    if (svc.healthCheck.http) {
      hc.http = {
        path: svc.healthCheck.http.path ?? "/",
        status_codes: svc.healthCheck.http.statusCodes ?? ["2??", "3??"],
        tls: svc.healthCheck.http.tls ?? false,
      };
    }
    payload.health_check = hc;
  }

  return payload;
}

function buildTargetPayload(t: LBTarget): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    type: t.type,
    use_private_ip: t.usePrivateIp ?? false,
  };

  if (t.type === "server") {
    payload.server = { id: resolveServerId(t.server) };
  } else if (t.type === "label_selector") {
    payload.label_selector = { selector: t.labelSelector };
  } else if (t.type === "ip") {
    payload.ip = { ip: t.ip };
  }

  return payload;
}

async function waitForAction(
  api: ReturnType<typeof createHetznerApi>,
  actionId: number,
): Promise<void> {
  await poll({
    description: `Hetzner action ${actionId}`,
    fn: async () => {
      const data: any = await api.get(`/actions/${actionId}`);
      return data.action;
    },
    predicate: (action: any) => action.status !== "running",
    initialDelay: 500,
    maxDelay: 5000,
    timeout: 120_000,
  });
}

export const LoadBalancer = Resource(
  "hetzner::LoadBalancer",
  async function (
    this: Context<LoadBalancer>,
    id: string,
    props: LoadBalancerProps,
  ): Promise<LoadBalancer> {
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        ...props,
        id: this.output?.id ?? 0,
        name,
        publicNet: this.output?.publicNet ?? {
          ipv4: { ip: "127.0.0.1" },
          ipv6: { ip: "::1" },
        },
        privateNet: this.output?.privateNet ?? [],
        created: this.output?.created ?? new Date().toISOString(),
      };
    }

    const api = createHetznerApi(props);

    if (this.phase === "delete") {
      if (this.output?.id) {
        logger.log(
          `🗑️  Deleting LoadBalancer: ${this.output.name} (${this.output.id})`,
        );
        try {
          await api.delete(`/load_balancers/${this.output.id}`);
        } catch (err: any) {
          if (err.status !== 404) throw err;
        }
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output?.id) {
      // Check immutable location field
      if (props.location && props.location !== this.output.location) {
        this.replace(true);
      }

      const lbId = this.output.id;

      // Update name and labels
      await api.put(`/load_balancers/${lbId}`, {
        name,
        labels: props.labels ?? {},
      });

      // Diff services
      const existingServices = new Map(
        (this.output.services ?? []).map((s) => [serviceKey(s), s]),
      );
      const desiredServices = new Map(
        props.services.map((s) => [serviceKey(s), s]),
      );

      for (const [key, svc] of desiredServices) {
        if (existingServices.has(key)) {
          const data: any = await api.post(
            `/load_balancers/${lbId}/actions/update_service`,
            buildServicePayload(svc),
          );
          await waitForAction(api, data.action.id);
        } else {
          const data: any = await api.post(
            `/load_balancers/${lbId}/actions/add_service`,
            buildServicePayload(svc),
          );
          await waitForAction(api, data.action.id);
        }
      }

      for (const [key, svc] of existingServices) {
        if (!desiredServices.has(key)) {
          const data: any = await api.post(
            `/load_balancers/${lbId}/actions/delete_service`,
            { listen_port: svc.listenPort },
          );
          await waitForAction(api, data.action.id);
        }
      }

      // Diff targets
      const existingTargets = new Map(
        (this.output.targets ?? []).map((t) => [targetKey(t), t]),
      );
      const desiredTargets = new Map(
        props.targets.map((t) => [targetKey(t), t]),
      );

      for (const [key, target] of desiredTargets) {
        if (!existingTargets.has(key)) {
          const data: any = await api.post(
            `/load_balancers/${lbId}/actions/add_target`,
            buildTargetPayload(target),
          );
          await waitForAction(api, data.action.id);
        }
      }

      for (const [key, target] of existingTargets) {
        if (!desiredTargets.has(key)) {
          const data: any = await api.post(
            `/load_balancers/${lbId}/actions/remove_target`,
            buildTargetPayload(target),
          );
          await waitForAction(api, data.action.id);
        }
      }

      // Fetch current state
      const { load_balancer: lb }: any = await api.get(
        `/load_balancers/${lbId}`,
      );

      return buildOutput(props, lb, name);
    }

    // CREATE phase
    const adopt = props.adopt ?? this.scope.adopt;

    if (adopt) {
      const listData: any = await api.get(
        `/load_balancers?name=${encodeURIComponent(name)}`,
      );
      const existing = listData.load_balancers?.[0];
      if (existing) {
        logger.log(`Adopting existing LoadBalancer: ${name} (${existing.id})`);
        return buildOutput(props, existing, name);
      }
    }

    const createBody: Record<string, unknown> = {
      name,
      load_balancer_type: props.loadBalancerType,
      labels: props.labels ?? {},
    };

    if (props.location) {
      createBody.location = props.location;
    }

    const networkId = resolveNetworkId(props.network);
    if (networkId) {
      createBody.network = networkId;
    }

    if (props.publicInterface === false) {
      createBody.public_interface = false;
    }

    logger.log(`🚀 Creating LoadBalancer: ${name}`);
    const createData: any = await api.post("/load_balancers", createBody);
    const lbId: number = createData.load_balancer.id;

    await waitForAction(api, createData.action.id);

    // Add services
    for (const svc of props.services) {
      const data: any = await api.post(
        `/load_balancers/${lbId}/actions/add_service`,
        buildServicePayload(svc),
      );
      await waitForAction(api, data.action.id);
    }

    // Add targets
    for (const target of props.targets) {
      const data: any = await api.post(
        `/load_balancers/${lbId}/actions/add_target`,
        buildTargetPayload(target),
      );
      await waitForAction(api, data.action.id);
    }

    const { load_balancer: lb }: any = await api.get(`/load_balancers/${lbId}`);

    logger.log(`  ✅ LoadBalancer ${name} created (${lbId})`);
    return buildOutput(props, lb, name);
  },
);

function buildOutput(
  props: LoadBalancerProps,
  lb: any,
  name: string,
): LoadBalancer {
  return {
    ...props,
    id: lb.id,
    name,
    loadBalancerType: lb.load_balancer_type?.name ?? props.loadBalancerType,
    location: lb.location?.name ?? props.location,
    publicNet: {
      ipv4: { ip: lb.public_net?.ipv4?.ip ?? "" },
      ipv6: { ip: lb.public_net?.ipv6?.ip ?? "" },
    },
    privateNet: (lb.private_net ?? []).map((pn: any) => ({
      networkId: pn.network,
      ip: pn.ip,
    })),
    created: lb.created,
  };
}
