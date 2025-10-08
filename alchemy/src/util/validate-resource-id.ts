export function validateResourceID(id: string, qualifier = "Resource"): void {
  //todo(sam): during effect rewrite, this should be much more limiting
  //todo:      its hard to undo the flexibility we've offered to users now
  if (!id) {
    throw new Error(`${qualifier} ID cannot be an empty string: "${id}"`);
  }
  if (id.includes(":")) {
    throw new Error(`${qualifier} ID cannot include colons: "${id}"`);
  }
}
