export function validateResourceID(id: string, qualifier = "Resource"): void {
  if (!id) {
    throw new Error(`${qualifier} ID cannot be an empty string: "${id}"`);
  }
}
