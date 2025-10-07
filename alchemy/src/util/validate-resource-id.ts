export function validateResourceID(id: string, qualifier = "Resource"): void {
  if (!id) {
    throw new Error(`${qualifier}ID cannot be an empty string: "${id}"`);
  }
  const validPattern = /^[a-zA-Z0-9\-_+().?]+$/;
  if (!validPattern.test(id)) {
    throw new Error(
      `${qualifier}ID contains invalid characters. Only alphanumeric, -, _, +, () are allowed: "${id}"`,
    );
  }
}
