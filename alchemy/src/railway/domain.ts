import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { RailwayApi, type RailwayApiOptions } from "./api.ts";
import { runRailwayDeleteMutation } from "./delete-retry.ts";
import type { Environment } from "./environment.ts";
import type { Service } from "./service.ts";

/**
 * Properties for creating or updating a Railway Domain
 */
export interface DomainProps extends RailwayApiOptions {
  /**
   * The service to attach the domain to
   */
  service: string | Service;

  /**
   * The environment for the domain
   */
  environment: string | Environment;

  /**
   * Custom domain name. If omitted, a Railway-generated domain is created.
   */
  domain?: string;

  /**
   * The port to route traffic to on the service
   */
  targetPort?: number;

  /**
   * The project ID (required for custom domains)
   */
  projectId?: string;
}

/**
 * Output type for a Railway Domain
 */
export type Domain = Omit<
  DomainProps,
  "service" | "environment" | "projectId"
> & {
  /**
   * The Railway domain ID
   */
  domainId: string;

  /**
   * The service ID
   */
  serviceId: string;

  /**
   * The environment ID
   */
  environmentId: string;

  /**
   * The fully qualified domain name
   */
  domain: string;

  /**
   * The port traffic is routed to
   */
  targetPort?: number;
};

/**
 * Type guard for Railway Domain
 */
export function isDomain(resource: any): resource is Domain {
  return resource?.[ResourceKind] === "railway::Domain";
}

/**
 * Creates and manages a domain for a Railway service.
 * If a `domain` prop is provided, a custom domain is created.
 * Otherwise, a Railway-generated domain (*.up.railway.app) is created.
 *
 * @example
 * ## Create a Railway domain
 *
 * Get a Railway-generated domain for a service.
 *
 * ```ts
 * const domain = await Domain("api-domain", {
 *   service,
 *   environment: project.defaultEnvironmentId,
 * });
 * console.log(domain.domain); // e.g. "my-app-production.up.railway.app"
 * ```
 *
 * @example
 * ## Create a custom domain
 *
 * Attach a custom domain to a service.
 *
 * ```ts
 * const domain = await Domain("custom-domain", {
 *   service,
 *   environment: project.defaultEnvironmentId,
 *   domain: "api.example.com",
 *   targetPort: 3000,
 * });
 * ```
 */
export const Domain = Resource(
  "railway::Domain",
  async function (
    this: Context<Domain>,
    id: string,
    props: DomainProps,
  ): Promise<Domain> {
    const serviceId =
      typeof props.service === "string"
        ? props.service
        : props.service.serviceId;
    const environmentId =
      typeof props.environment === "string"
        ? props.environment
        : props.environment.environmentId;

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        domainId: this.output?.domainId ?? "",
        serviceId,
        environmentId,
        domain: props.domain ?? this.output?.domain ?? "local.up.railway.app",
        targetPort: props.targetPort,
      };
    }

    const api = new RailwayApi(props);

    if (this.phase === "delete") {
      const domainId = this.output?.domainId;
      if (domainId) {
        const deleteMutation = this.output?.domain?.endsWith(".up.railway.app")
          ? `mutation serviceDomainDelete($id: String!) {
              serviceDomainDelete(id: $id)
            }`
          : `mutation customDomainDelete($id: String!) {
              customDomainDelete(id: $id)
            }`;

        await runRailwayDeleteMutation(() =>
          api.query(deleteMutation, { id: domainId }),
        );
      }
      return this.destroy();
    }

    // Domain name is immutable — replace if changed
    if (
      this.phase === "update" &&
      props.domain &&
      this.output?.domain !== props.domain
    ) {
      return this.replace();
    }

    const domainId = this.output?.domainId;

    if (this.phase === "update" && domainId && this.output) {
      // Update — only targetPort can be updated via serviceInstanceUpdate
      if (
        props.targetPort !== undefined &&
        props.targetPort !== this.output.targetPort
      ) {
        await api.query(
          `mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
            serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
          }`,
          {
            serviceId,
            environmentId,
            input: { targetPort: props.targetPort },
          },
        );
      }

      return {
        domainId: this.output.domainId,
        serviceId: this.output.serviceId,
        environmentId: this.output.environmentId,
        domain: this.output.domain,
        targetPort: props.targetPort,
      };
    }

    // Create
    let domain: string;
    let newDomainId: string;

    if (props.domain) {
      // Custom domain
      const projectId =
        props.projectId ??
        (typeof props.service !== "string"
          ? props.service.projectId
          : undefined);

      if (!projectId) {
        throw new Error(
          "projectId is required for custom domains. Pass it directly or use a Service resource reference.",
        );
      }

      const data = await api.query<{
        customDomainCreate: {
          id: string;
          domain: string;
        };
      }>(
        `mutation customDomainCreate($input: CustomDomainCreateInput!) {
          customDomainCreate(input: $input) {
            id
            domain
          }
        }`,
        {
          input: {
            projectId,
            environmentId,
            serviceId,
            domain: props.domain,
            targetPort: props.targetPort,
          },
        },
      );

      domain = data.customDomainCreate.domain;
      newDomainId = data.customDomainCreate.id;
    } else {
      // Railway-generated domain
      const data = await api.query<{
        serviceDomainCreate: {
          id: string;
          domain: string;
        };
      }>(
        `mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
          serviceDomainCreate(input: $input) {
            id
            domain
          }
        }`,
        {
          input: {
            serviceId,
            environmentId,
            targetPort: props.targetPort,
          },
        },
      );

      domain = data.serviceDomainCreate.domain;
      newDomainId = data.serviceDomainCreate.id;
    }

    return {
      domainId: newDomainId,
      serviceId,
      environmentId,
      domain,
      targetPort: props.targetPort,
    };
  },
);
