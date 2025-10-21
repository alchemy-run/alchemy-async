import * as fs from "node:fs/promises";
import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { Website } from "../../src/cloudflare/website.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";
import { assertWorkerDoesNotExist } from "./test-helpers.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

// Create a Cloudflare API client for verification
const api = await createCloudflareApi();

describe("Website Resource", () => {
  test("create website with url false and verify no workers.dev subdomain", async (scope) => {
    const name = `${BRANCH_PREFIX}-test-website-no-url`;
    const tempDir = path.resolve(".out", "alchemy-website-no-url-test");
    const distDir = path.resolve(tempDir, "dist");
    const entrypoint = path.resolve(tempDir, "worker.ts");

    try {
      // Create temporary directory structure
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(distDir, { recursive: true });

      // Create a simple index.html in the dist directory
      await fs.writeFile(
        path.join(distDir, "index.html"),
        "<html><body>Hello Website without subdomain!</body></html>",
      );

      // Create a simple worker entrypoint
      await fs.writeFile(
        entrypoint,
        `export default {
          async fetch(request, env) {
            return new Response("Hello from website worker without subdomain!");
          }
        };`,
      );

      // Create website with url: false (disable workers.dev subdomain)
      const website = await Website(name, {
        name,
        entrypoint,
        assets: distDir,
        url: false, // Explicitly disable workers.dev URL
        adopt: true,
      });

      expect(website.name).toBe(name);
      expect(website.url).toBeUndefined(); // No URL should be provided

      // Query Cloudflare API to verify subdomain is not enabled
      const subdomainResponse = await api.get(
        `/accounts/${api.accountId}/workers/scripts/${name}/subdomain`,
      );

      // The subdomain endpoint should either return 404 or indicate it's disabled
      if (subdomainResponse.status === 200) {
        const subdomainData: any = await subdomainResponse.json();
        expect(subdomainData.result?.enabled).toBeFalsy();
      } else {
        // If 404, that also indicates no subdomain is configured
        expect(subdomainResponse.status).toEqual(404);
      }

      // Try to access the website via workers.dev subdomain - should fail
      try {
        const workerSubdomainUrl = `https://${name}.${api.accountId.substring(0, 32)}.workers.dev`;
        const subdomainTestResponse = await fetch(workerSubdomainUrl);

        // If the fetch succeeds, the subdomain shouldn't be working
        // Workers.dev subdomains that are disabled typically return 404 or 503
        expect(subdomainTestResponse.status).toBeGreaterThanOrEqual(400);
      } catch (error) {
        // Network errors are also expected when subdomain is disabled
        expect(error).toBeDefined();
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      await destroy(scope);
      await assertWorkerDoesNotExist(api, name);
    }
  });

  test("respects cwd property for wrangler.jsonc placement", async (scope) => {
    const name = `${BRANCH_PREFIX}-test-website-cwd`;
    const tempDir = path.resolve(".out", "alchemy-website-cwd-test");
    const subDir = path.resolve(tempDir, "subproject");
    const distDir = path.resolve(subDir, "dist");
    const entrypoint = path.resolve(subDir, "worker.ts");

    try {
      // Create temporary directory structure
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(subDir, { recursive: true });
      await fs.mkdir(distDir, { recursive: true });

      // Create a simple index.html in the dist directory
      await fs.writeFile(
        path.join(distDir, "index.html"),
        "<html><body>Hello Website!</body></html>",
      );

      // Create a simple worker entrypoint
      await fs.writeFile(
        entrypoint,
        `export default {
          async fetch(request, env) {
            return new Response("Hello from worker!");
          }
        };`,
      );

      // Create website with cwd pointing to subdirectory
      const website = await Website(name, {
        name,
        cwd: subDir,
        entrypoint,
        assets: distDir, // Use absolute path for assets
        adopt: true,
      });

      // Verify the website was created successfully
      expect(website.name).toBe(name);
      expect(website.url).toBeDefined();

      // Verify wrangler.jsonc was created in the correct location (subDir/.alchemy/local/wrangler.jsonc)
      const wranglerPath = path.join(
        subDir,
        ".alchemy",
        "local",
        "wrangler.jsonc",
      );
      await expect(fs.access(wranglerPath)).resolves.toBeUndefined();

      // Verify wrangler.jsonc was NOT created in the root tempDir
      const rootWranglerPath = path.join(tempDir, "wrangler.jsonc");
      await expect(fs.access(rootWranglerPath)).rejects.toThrow();

      // Verify the contents of wrangler.jsonc
      const wranglerContent = await fs.readFile(wranglerPath, "utf-8");
      const wranglerJson = JSON.parse(wranglerContent);

      expect(wranglerJson.main).toBe("../../worker.ts");
      expect(wranglerJson.name).toBe(name);
      expect(wranglerJson.assets).toMatchObject({
        binding: "ASSETS",
        directory: "../../dist",
      });
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      await destroy(scope);
    }
  });

  test("respects cwd property with custom wrangler path", async (scope) => {
    const name = `${BRANCH_PREFIX}-test-website-cwd-custom`;
    const tempDir = path.resolve(".out", "alchemy-website-cwd-custom-test");
    const subDir = path.join(tempDir, "myproject");
    const distDir = path.join(subDir, "dist");
    const entrypoint = path.join(subDir, "worker.ts");

    try {
      // Create temporary directory structure
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(subDir, { recursive: true });
      await fs.mkdir(distDir, { recursive: true });

      // Create a simple index.html in the dist directory
      await fs.writeFile(
        path.join(distDir, "index.html"),
        "<html><body>Hello Custom Website!</body></html>",
      );

      // Create a simple worker entrypoint
      await fs.writeFile(
        entrypoint,
        `export default {
          async fetch(request, env) {
            return new Response("Hello from custom worker!");
          }
        };`,
      );

      // Create website with cwd and custom wrangler filename
      const website = await Website(name, {
        name,
        cwd: subDir,
        entrypoint,
        assets: path.resolve(distDir), // Use absolute path for assets
        wrangler: {
          path: "custom-wrangler.json",
        },
        adopt: true,
      });

      // Verify the website was created successfully
      expect(website.name).toBe(name);

      // Verify custom wrangler file was created in the correct location (subDir)
      const wranglerPath = path.join(subDir, "custom-wrangler.json");
      await expect(fs.access(wranglerPath)).resolves.toBeUndefined();

      // Verify custom wrangler file was NOT created in the root tempDir
      const rootWranglerPath = path.join(tempDir, "custom-wrangler.json");
      await expect(fs.access(rootWranglerPath)).rejects.toThrow();
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      await destroy(scope);
    }
  });

  test("places wrangler.jsonc in .alchemy/local when no cwd specified", async (scope) => {
    const name = `${BRANCH_PREFIX}-test-website-default-cwd`;
    const tempDir = path.join(".out", "alchemy-website-default-test");
    const distDir = path.join(tempDir, "dist");
    const entrypoint = path.join(tempDir, "worker.ts");

    try {
      // Create temporary directory structure
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(distDir, { recursive: true });

      // Create a simple index.html in the dist directory
      await fs.writeFile(
        path.join(distDir, "index.html"),
        "<html><body>Hello Default Website!</body></html>",
      );

      // Create a simple worker entrypoint
      await fs.writeFile(
        entrypoint,
        `export default {
          async fetch(request, env) {
            return new Response("Hello from default worker!");
          }
        };`,
      );

      // Create website without specifying cwd (should use process.cwd())
      const website = await Website(name, {
        name,
        entrypoint,
        assets: path.join(tempDir, "dist"), // Use absolute path since no cwd specified
        adopt: true,
      });

      // Verify the website was created successfully
      expect(website.name).toBe(name);

      // Verify wrangler.jsonc was created in the current working directory (project root)
      // Since we didn't specify cwd, it should be placed relative to process.cwd()
      const wranglerPath = path.join(
        process.cwd(),
        ".alchemy",
        "local",
        "wrangler.jsonc",
      );
      const wranglerExists = await fs
        .access(wranglerPath)
        .then(() => true)
        .catch(() => false);

      expect(wranglerExists).toBe(true);

      // Clean up the wrangler.jsonc file in the project root
      if (wranglerExists) {
        await fs.rm(wranglerPath, { force: true });
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      await destroy(scope);
    }
  });

  test("wrangler.transform hook modifies wrangler.json before writing", async (scope) => {
    const name = `${BRANCH_PREFIX}-test-website-transform-hook`;
    const tempDir = path.resolve(".out", "alchemy-website-transform-hook-test");
    const distDir = path.resolve(tempDir, "dist");
    const entrypoint = path.resolve(tempDir, "worker.ts");

    try {
      // Create temporary directory structure
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(distDir, { recursive: true });

      // Create a simple index.html in the dist directory
      await fs.writeFile(
        path.join(distDir, "index.html"),
        "<html><body>Hello Website with Hook!</body></html>",
      );

      // Create a simple worker entrypoint
      await fs.writeFile(
        entrypoint,
        `export default {
          async fetch(request, env) {
            return new Response("Hello from worker with hook!");
          }
        };`,
      );

      // Create website with transform.wrangler hook
      const website = await Website(name, {
        name,
        cwd: tempDir,
        entrypoint,
        assets: distDir,
        adopt: true,
        wrangler: {
          transform: (spec) => {
            // Modify the spec to add custom fields
            return {
              ...spec,
              vars: {
                ...spec.vars,
                CUSTOM_VAR: "custom-value",
              },
              node_compat: true,
              minify: true,
            };
          },
        },
      });

      // Verify the website was created successfully
      expect(website.name).toBe(name);
      expect(website.url).toBeDefined();

      // Verify wrangler.jsonc was created with the hook modifications
      const wranglerPath = path.join(
        tempDir,
        ".alchemy",
        "local",
        "wrangler.jsonc",
      );
      await expect(fs.access(wranglerPath)).resolves.toBeUndefined();

      // Verify the contents of wrangler.jsonc include the hook modifications
      const wranglerContent = await fs.readFile(wranglerPath, "utf-8");
      const wranglerJson = JSON.parse(wranglerContent);

      expect(wranglerJson.name).toBe(name);
      expect(wranglerJson.main).toBe("../../worker.ts");
      expect(wranglerJson.assets).toMatchObject({
        binding: "ASSETS",
        directory: "../../dist",
      });

      // Verify the hook modifications were applied
      expect(wranglerJson.vars).toMatchObject({
        CUSTOM_VAR: "custom-value",
      });
      expect(wranglerJson.node_compat).toBe(true);
      expect(wranglerJson.minify).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      await destroy(scope);
      await assertWorkerDoesNotExist(api, name);
    }
  });
});
