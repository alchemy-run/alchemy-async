import { createPlanetScaleClient, type PlanetScaleProps } from "./api.ts";
import type { Organization } from "./api/types.gen.ts";

export type OrganizationRef = Organization;

export async function OrganizationRef(
  name: string | Organization,
  options: PlanetScaleProps = {},
) {
  const api = createPlanetScaleClient(options);
  const organization = await api.getOrganization({
    path: {
      name: typeof name === "string" ? name : name.id,
    },
  });
  return organization.data;
}
