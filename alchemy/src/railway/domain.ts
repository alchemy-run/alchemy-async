import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import {
  createRailwayApi,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";
import { isEnvironment, type Environment } from "./environment.ts";
import { isService, type Service } from "./service.ts";

/**
 * Properties for creating a Railway domain
 */
export interface DomainProps extends RailwayApiOptions {
  /**
   * The service to attach the domain to
   */
  service: string | Service;

  /**
   * The environment to attach the domain to
   */
  environment: string | Environment;

  /**
   * Custom domain to use (e.g., "api.example.com")
   * If not provided, a Railway-generated domain will be created
   */
  customDomain?: string;

  /**
   * Whether to delete the domain when the resource is destroyed.
   * @default true
   */
  delete?: boolean;
}

/**
 * Output returned after Railway domain creation
 */
export interface Domain {
  /**
   * The ID of the domain
   */
  id: string;

  /**
   * The domain name
   */
  domain: string;

  /**
   * The service ID this domain is attached to
   */
  serviceId: string;

  /**
   * The environment ID this domain is attached to
   */
  environmentId: string;

  /**
   * Whether this is a custom domain
   */
  isCustom: boolean;

  /**
   * Target port for the domain (for custom domains)
   */
  targetPort?: number;
}

/**
 * GraphQL response types
 * @internal
 */
interface ServiceDomainCreateResponse {
  serviceDomainCreate: {
    id: string;
    domain: string;
    serviceId: string;
    environmentId: string;
    targetPort?: number;
  };
}

interface CustomDomainCreateResponse {
  customDomainCreate: {
    id: string;
    domain: string;
    serviceId: string;
    environmentId: string;
    targetPort?: number;
  };
}

/**
 * Type guard for Railway Domain
 */
export function isDomain(resource: any): resource is Domain {
  return resource?.[ResourceKind] === "railway::Domain";
}

/**
 * Get the service ID from a service reference
 */
function getServiceId(service: string | Service): string {
  if (isService(service)) {
    return service.id;
  }
  return service;
}

/**
 * Get the environment ID from an environment reference
 */
function getEnvironmentId(environment: string | Environment): string {
  if (isEnvironment(environment)) {
    return environment.id;
  }
  return environment;
}

/**
 * Creates a Railway domain for accessing a service.
 *
 * @example
 * // Create a Railway-generated domain:
 * const domain = await Domain("api-domain", {
 *   service: apiService,
 *   environment: production
 * });
 * console.log(`API available at: https://${domain.domain}`);
 *
 * @example
 * // Create a custom domain:
 * const domain = await Domain("custom-domain", {
 *   service: apiService,
 *   environment: production,
 *   customDomain: "api.example.com"
 * });
 */
export const Domain = Resource(
  "railway::Domain",
  async function (
    this: Context<Domain>,
    id: string,
    props: DomainProps,
  ): Promise<Domain> {
    const api = createRailwayApi(props);
    const serviceId = getServiceId(props.service);
    const environmentId = getEnvironmentId(props.environment);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        try {
          if (this.output.isCustom) {
            await api.request(
              `
              mutation customDomainDelete($id: String!) {
                customDomainDelete(id: $id)
              }
            `,
              { id: this.output.id },
            );
          } else {
            await api.request(
              `
              mutation serviceDomainDelete($id: String!) {
                serviceDomainDelete(id: $id)
              }
            `,
              { id: this.output.id },
            );
          }
        } catch (error) {
          // Ignore 404 errors (domain already deleted)
          if (error instanceof RailwayError && error.code === "NOT_FOUND") {
            // Already deleted, that's fine
          } else {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    // Domains are immutable - changing domain type requires replacement
    if (this.phase === "update" && this.output?.id) {
      const currentIsCustom = this.output.isCustom;
      const newIsCustom = !!props.customDomain;

      // If switching between custom and generated, replace
      if (currentIsCustom !== newIsCustom) {
        return this.replace();
      }

      // If custom domain name changed, replace
      if (newIsCustom && this.output.domain !== props.customDomain) {
        return this.replace();
      }

      // No changes needed
      return this.output;
    }

    // Create custom domain
    if (props.customDomain) {
      const data = await api.request<CustomDomainCreateResponse>(
        `
        mutation customDomainCreate($input: CustomDomainCreateInput!) {
          customDomainCreate(input: $input) {
            id
            domain
            serviceId
            environmentId
            targetPort
          }
        }
      `,
        {
          input: {
            domain: props.customDomain,
            serviceId,
            environmentId,
          },
        },
      );

      return {
        id: data.customDomainCreate.id,
        domain: data.customDomainCreate.domain,
        serviceId: data.customDomainCreate.serviceId,
        environmentId: data.customDomainCreate.environmentId,
        isCustom: true,
        targetPort: data.customDomainCreate.targetPort,
      };
    }

    // Create Railway-generated domain
    const data = await api.request<ServiceDomainCreateResponse>(
      `
      mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
        serviceDomainCreate(input: $input) {
          id
          domain
          serviceId
          environmentId
          targetPort
        }
      }
    `,
      {
        input: {
          serviceId,
          environmentId,
        },
      },
    );

    return {
      id: data.serviceDomainCreate.id,
      domain: data.serviceDomainCreate.domain,
      serviceId: data.serviceDomainCreate.serviceId,
      environmentId: data.serviceDomainCreate.environmentId,
      isCustom: false,
      targetPort: data.serviceDomainCreate.targetPort,
    };
  },
);
