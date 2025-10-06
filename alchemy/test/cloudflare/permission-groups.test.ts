import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { PermissionGroups } from "../../src/cloudflare/permission-groups.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("PermissionGroups Resource", () => {
  test("fetch and verify well-known permission groups", async (scope) => {
    try {
      // Fetch all permission groups
      const permissionGroups = await PermissionGroups();

      // Verify the resource has expected properties
      expect(permissionGroups).toBeTruthy();

      // Verify R2 related permission groups exist
      expect(permissionGroups["Workers R2 Storage Write"]).toBeTruthy();
      expect(permissionGroups["Workers R2 Storage Read"]).toBeTruthy();
      expect(
        permissionGroups["Workers R2 Storage Bucket Item Write"],
      ).toBeTruthy();
      expect(
        permissionGroups["Workers R2 Storage Bucket Item Read"],
      ).toBeTruthy();

      // Verify the structure of one of the permission groups
      const r2ReadGroup = permissionGroups["Workers R2 Storage Read"];
      expect(r2ReadGroup.id).toBeTruthy();
      expect(r2ReadGroup.name).toEqual("Workers R2 Storage Read");
      expect(Array.isArray(r2ReadGroup.scopes)).toBe(true);
      expect(r2ReadGroup.scopes.length).toBeGreaterThan(0);

      // Verify some other common permission groups
      expect(permissionGroups["Account Settings Read"]).toBeTruthy();
      expect(permissionGroups["DNS Read"]).toBeTruthy();
      expect(permissionGroups["Workers Scripts Write"]).toBeTruthy();
    } finally {
      // Clean up - this should just destroy the reference to the permission groups
      // since it's a read-only resource
      await alchemy.destroy(scope);
    }
  });
});
