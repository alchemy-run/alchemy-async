import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  Container,
  ContainerApplication,
  createCloudflareApi,
  getContainerApplicationByName,
} from "../../src/cloudflare/index.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { Image } from "../../src/docker/image.ts";
import { RemoteImage } from "../../src/docker/remote-image.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const api = await createCloudflareApi();

describe.sequential("Container Resource", () => {
  test("create container", async (scope) => {
    try {
      const make = async (dockerfile?: string) =>
        Worker(`container-test-worker${BRANCH_PREFIX}`, {
          name: `container-test-worker${BRANCH_PREFIX}`,
          adopt: true,
          entrypoint: path.join(import.meta.dirname, "container-handler.ts"),
          compatibilityFlags: ["nodejs_compat"],
          compatibilityDate: "2025-06-24",
          format: "esm",
          bindings: {
            MY_CONTAINER: await Container(`container-test${BRANCH_PREFIX}`, {
              className: "MyContainer",
              name: "test-image",
              tag: "latest",
              build: {
                context: path.join(import.meta.dirname, "container"),
                dockerfile,
              },
              maxInstances: 1,
              adopt: true,
            }),
          },
        });

      // create
      await make();
      // update
      await make("Dockerfile.update");
    } finally {
      // delete
      await destroy(scope);
    }
  });

  test("max_instances is set on ContainerApplication", async (scope) => {
    try {
      const containerName = `container-test-max-instances${BRANCH_PREFIX}`;
      const make = async (dockerfile?: string) =>
        Worker(`container-test-worker-max-instances${BRANCH_PREFIX}`, {
          name: `container-test-worker-max-instances${BRANCH_PREFIX}`,
          adopt: true,
          entrypoint: path.join(import.meta.dirname, "container-handler.ts"),
          compatibilityFlags: ["nodejs_compat"],
          compatibilityDate: "2025-06-24",
          format: "esm",
          bindings: {
            MY_CONTAINER: await Container(containerName, {
              className: "MyContainer",
              name: containerName,
              tag: "latest",
              build: {
                context: path.join(import.meta.dirname, "container"),
                dockerfile,
              },
              maxInstances: 2,
              adopt: true,
            }),
          },
        });

      // create
      await make();
      // update
      await make("Dockerfile.update");

      const app = await getContainerApplicationByName(api, containerName);
      expect(app?.max_instances).toBe(2);
    } finally {
      // delete
      await destroy(scope);
    }
  });

  test("adopt container bound to worker with same DO namespace id", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-container-do-worker`;
    const containerName = `${BRANCH_PREFIX}-container-with-do`;

    async function create(suffix: string) {
      await Worker(`worker-${suffix}`, {
        name: workerName,
        adopt: true,
        entrypoint: path.join(import.meta.dirname, "container-handler.ts"),
        compatibilityFlags: ["nodejs_compat"],
        compatibilityDate: "2025-06-24",
        format: "esm",
        bindings: {
          MY_CONTAINER: await Container("container", {
            className: "MyContainer",
            name: containerName,
            adopt: true,
            tag: "v1",
            build: {
              context: path.join(import.meta.dirname, "container"),
            },
            maxInstances: 1,
          }),
        },
      });
    }

    try {
      await create("1");
      await create("2");
    } finally {
      await destroy(scope);
    }
  });

  test("container application adoption with non-existent app", async (scope) => {
    const applicationId = `${BRANCH_PREFIX}-container-app-nonexistent`;

    // Create a container to get the properly configured image
    const container = await Container(
      `${BRANCH_PREFIX}-container-for-nonexistent`,
      {
        className: "TestContainer",
        name: "test-container-nonexistent",
        tag: "latest",
        build: {
          context: path.join(import.meta.dirname, "container"),
        },
        adopt: true,
      },
    );

    try {
      // Test that adopting a non-existent application creates it normally
      const containerApp = await ContainerApplication(applicationId, {
        name: applicationId,
        adopt: true,
        image: container.image,
        instances: 1,
        maxInstances: 2,
      });

      expect(containerApp).toMatchObject({
        name: applicationId,
        id: expect.any(String),
      });
    } finally {
      await destroy(scope);
    }
  });

  test("pull and push external image (by ref) to CF", async (scope) => {
    const containerName = `${BRANCH_PREFIX}-external-image`;

    try {
      // Use a small external image - automatically pushed to CF
      const container = await Container(containerName, {
        className: "TestContainer",
        name: containerName,
        image: "nginx:alpine",
        adopt: true,
      });

      expect(container.image.imageRef).toContain("registry.cloudflare.com");
      expect(container.image.name).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  });

  test("pull and push pulled Image to CF", async (scope) => {
    const containerName = `${BRANCH_PREFIX}-external-image`;

    try {
      const image = await Image("image", {
        image: "nginx:alpine",
      });
      // Use a small external image - automatically pushed to CF
      const container = await Container(containerName, {
        className: "TestContainer",
        name: containerName,
        image,
        adopt: true,
      });

      expect(container.image.imageRef).toContain("registry.cloudflare.com");
      expect(container.image.name).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  });

  test("pull and push pulled RemoteImage to CF", async (scope) => {
    const containerName = `${BRANCH_PREFIX}-external-image`;

    try {
      const image = await RemoteImage("image", {
        name: "nginx",
        tag: "alpine",
      });
      // Use a small external image - automatically pushed to CF
      const container = await Container(containerName, {
        className: "TestContainer",
        name: containerName,
        image,
        adopt: true,
      });

      expect(container.image.imageRef).toContain("registry.cloudflare.com");
      expect(container.image.name).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  });

  test("pull and push pre-built Image to CF", async (scope) => {
    const containerName = `${BRANCH_PREFIX}-external-image`;

    try {
      const image = await Image("image", {
        name: "my-image",
        tag: "latest",
        build: {
          context: path.join(import.meta.dirname, "container"),
        },
      });
      // Use a small external image - automatically pushed to CF
      const container = await Container(containerName, {
        className: "TestContainer",
        name: containerName,
        image,
        adopt: true,
      });

      expect(container.image.imageRef).toContain("registry.cloudflare.com");
      expect(container.image.name).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  });

  test("rollout with rolling strategy is passed through Worker", async (scope) => {
    const containerName = `${BRANCH_PREFIX}-container-rollout-worker`;
    const workerName = `${BRANCH_PREFIX}-worker-with-rollout`;

    try {
      const container = await Container(containerName, {
        className: "MyContainer",
        name: containerName,
        tag: "latest",
        build: {
          context: path.join(import.meta.dirname, "container"),
        },
        adopt: true,
        maxInstances: 2,
        rollout: {
          strategy: "rolling",
          stepPercentage: 25,
        },
      });

      expect(container.rollout).toMatchObject({
        strategy: "rolling",
        stepPercentage: 25,
      });

      // Create worker with the container binding
      await Worker(workerName, {
        name: workerName,
        adopt: true,
        entrypoint: path.join(import.meta.dirname, "container-handler.ts"),
        compatibilityFlags: ["nodejs_compat"],
        compatibilityDate: "2025-06-24",
        format: "esm",
        bindings: {
          MY_CONTAINER: container,
        },
      });

      // Verify the container application was created
      const app = await getContainerApplicationByName(api, containerName);
      expect(app).toBeDefined();
      expect(app?.name).toBe(containerName);
    } finally {
      await destroy(scope);
    }
  });

  test("rollout with immediate strategy", async (scope) => {
    const containerName = `${BRANCH_PREFIX}-container-immediate-rollout`;
    const workerName = `${BRANCH_PREFIX}-worker-immediate-rollout`;

    try {
      const container = await Container(containerName, {
        className: "MyContainer",
        name: containerName,
        tag: "latest",
        build: {
          context: path.join(import.meta.dirname, "container"),
        },
        adopt: true,
        maxInstances: 2,
        rollout: {
          strategy: "immediate",
        },
      });

      expect(container.rollout).toMatchObject({
        strategy: "immediate",
      });

      // Create worker with the container binding
      await Worker(workerName, {
        name: workerName,
        adopt: true,
        entrypoint: path.join(import.meta.dirname, "container-handler.ts"),
        compatibilityFlags: ["nodejs_compat"],
        compatibilityDate: "2025-06-24",
        format: "esm",
        bindings: {
          MY_CONTAINER: container,
        },
      });

      // Verify the container application was created
      const app = await getContainerApplicationByName(api, containerName);
      expect(app).toBeDefined();
      expect(app?.name).toBe(containerName);
    } finally {
      await destroy(scope);
    }
  });
});
