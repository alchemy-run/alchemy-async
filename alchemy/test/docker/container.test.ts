import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { DockerApi } from "../../src/docker/api.ts";
import { Container } from "../../src/docker/container.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const ONE_SECOND_IN_NANOSECONDS = 1_000_000_000;

describe("Container", () => {
  test("should create a container without starting it", async (scope) => {
    try {
      // Create a container without starting it to avoid port conflicts
      const container = await Container("test-container", {
        image: "hello-world:latest",
        name: "alchemy-test-container",
        start: false,
      });

      expect(container.name).toBe("alchemy-test-container");
      expect(container.state).toBe("created");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a container with healthcheck configuration", async (scope) => {
    try {
      const api = new DockerApi();

      // Create a container with healthcheck
      const container = await Container("test-healthcheck-container", {
        image: "nginx:latest",
        name: "alchemy-test-healthcheck-container",
        healthcheck: {
          cmd: ["curl", "-f", "http://localhost/"],
          interval: 10,
          timeout: 5,
          retries: 3,
          startPeriod: 5,
          startInterval: 4,
        },
        start: false,
      });

      expect(container.name).toBe("alchemy-test-healthcheck-container");
      expect(container.state).toBe("created");
      expect(container.healthcheck).toBeDefined();
      expect(container.healthcheck?.cmd).toEqual([
        "curl",
        "-f",
        "http://localhost/",
      ]);
      expect(container.healthcheck?.interval).toBe(10);
      expect(container.healthcheck?.timeout).toBe(5);
      expect(container.healthcheck?.retries).toBe(3);
      expect(container.healthcheck?.startPeriod).toBe(5);

      // Verify healthcheck was applied by inspecting the container
      const { stdout } = await api.exec([
        "inspect",
        container.id,
        "--format",
        "{{json .Config.Healthcheck}}",
      ]);

      const healthcheckData = JSON.parse(stdout.trim());
      expect(healthcheckData).toBeDefined();
      expect(healthcheckData.Test).toBeInstanceOf(Array);
      expect(healthcheckData.Test[1]).toContain("curl");

      // Verify interval (in nanoseconds)
      expect(healthcheckData.Interval).toBe(10 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Timeout).toBe(5 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Retries).toBe(3);
      expect(healthcheckData.StartPeriod).toBe(5 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.StartInterval).toBe(4 * ONE_SECOND_IN_NANOSECONDS);
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a container with shell-based healthcheck", async (scope) => {
    try {
      const api = new DockerApi();

      // Create a container with shell-based healthcheck
      const container = await Container("test-shell-healthcheck-container", {
        image: "nginx:latest",
        name: "alchemy-test-shell-healthcheck-container",
        healthcheck: {
          cmd: "curl -f http://localhost/ || exit 1",
          interval: 15,
          timeout: 3,
          retries: 2,
          startPeriod: 7,
        },
        start: false,
      });

      expect(container.name).toBe("alchemy-test-shell-healthcheck-container");
      expect(container.healthcheck).toBeDefined();
      expect(container.healthcheck?.cmd).toBe(
        "curl -f http://localhost/ || exit 1",
      );

      // Verify healthcheck was applied
      const { stdout } = await api.exec([
        "inspect",
        container.id,
        "--format",
        "{{json .Config.Healthcheck}}",
      ]);

      const healthcheckData = JSON.parse(stdout.trim());
      expect(healthcheckData).toBeDefined();
      expect(healthcheckData.Test).toBeInstanceOf(Array);
      expect(healthcheckData.Test[1]).toContain("curl");

      // Verify interval (in nanoseconds)
      expect(healthcheckData.Interval).toBe(15 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Timeout).toBe(3 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Retries).toBe(2);
      expect(healthcheckData.StartPeriod).toBe(7 * ONE_SECOND_IN_NANOSECONDS);
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a container with startInterval healthcheck option", async (scope) => {
    try {
      const api = new DockerApi();

      // Create a container with healthcheck including startInterval
      const container = await Container(
        "test-startinterval-healthcheck-container",
        {
          image: "nginx:latest",
          name: "alchemy-test-startinterval-healthcheck-container",
          healthcheck: {
            cmd: ["curl", "-f", "http://localhost/"],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
            startInterval: 5,
          },
          start: false,
        },
      );

      expect(container.name).toBe(
        "alchemy-test-startinterval-healthcheck-container",
      );
      expect(container.healthcheck).toBeDefined();
      expect(container.healthcheck?.startInterval).toBe(5);

      // Verify healthcheck was applied
      const { stdout } = await api.exec([
        "inspect",
        container.id,
        "--format",
        "{{json .Config.Healthcheck}}",
      ]);

      const healthcheckData = JSON.parse(stdout.trim());
      expect(healthcheckData).toBeDefined();
      expect(healthcheckData.Test).toBeInstanceOf(Array);
      expect(healthcheckData.Test[1]).toContain("curl");

      // Verify all healthcheck parameters (in nanoseconds)
      expect(healthcheckData.Interval).toBe(30 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Timeout).toBe(5 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Retries).toBe(3);
      expect(healthcheckData.StartPeriod).toBe(60 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.StartInterval).toBe(5 * ONE_SECOND_IN_NANOSECONDS);
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a container with string duration format healthcheck", async (scope) => {
    try {
      const api = new DockerApi();

      // Create a container with healthcheck using string duration format
      const container = await Container(
        "test-string-duration-healthcheck-container",
        {
          image: "nginx:latest",
          name: "alchemy-test-string-duration-healthcheck-container",
          healthcheck: {
            cmd: ["curl", "-f", "http://localhost/"],
            interval: "30s",
            timeout: "5s",
            retries: 3,
            startPeriod: "1m",
            startInterval: "500ms",
          },
          start: false,
        },
      );

      expect(container.name).toBe(
        "alchemy-test-string-duration-healthcheck-container",
      );
      expect(container.healthcheck).toBeDefined();
      expect(container.healthcheck?.interval).toBe("30s");
      expect(container.healthcheck?.timeout).toBe("5s");
      expect(container.healthcheck?.startPeriod).toBe("1m");
      expect(container.healthcheck?.startInterval).toBe("500ms");

      // Verify healthcheck was applied
      const { stdout } = await api.exec([
        "inspect",
        container.id,
        "--format",
        "{{json .Config.Healthcheck}}",
      ]);

      const healthcheckData = JSON.parse(stdout.trim());
      expect(healthcheckData).toBeDefined();
      expect(healthcheckData.Test).toBeInstanceOf(Array);
      expect(healthcheckData.Test[1]).toContain("curl");

      // Verify all healthcheck parameters (in nanoseconds)
      expect(healthcheckData.Interval).toBe(30 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Timeout).toBe(5 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Retries).toBe(3);
      expect(healthcheckData.StartPeriod).toBe(60 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.StartInterval).toBe(
        (1 / 2) * ONE_SECOND_IN_NANOSECONDS,
      );
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a container with mixed duration formats", async (scope) => {
    try {
      const api = new DockerApi();

      // Create a container with healthcheck using mixed formats
      const container = await Container(
        "test-mixed-duration-healthcheck-container",
        {
          image: "nginx:latest",
          name: "alchemy-test-mixed-duration-healthcheck-container",
          healthcheck: {
            cmd: "curl -f http://localhost/ || exit 1",
            interval: "2m",
            timeout: 10,
            retries: 5,
            startPeriod: "90s",
          },
          start: false,
        },
      );

      expect(container.name).toBe(
        "alchemy-test-mixed-duration-healthcheck-container",
      );
      expect(container.healthcheck).toBeDefined();
      expect(container.healthcheck?.interval).toBe("2m");
      expect(container.healthcheck?.timeout).toBe(10);
      expect(container.healthcheck?.startPeriod).toBe("90s");

      // Verify healthcheck was applied
      const { stdout } = await api.exec([
        "inspect",
        container.id,
        "--format",
        "{{json .Config.Healthcheck}}",
      ]);

      const healthcheckData = JSON.parse(stdout.trim());
      expect(healthcheckData).toBeDefined();
      expect(healthcheckData.Test).toBeInstanceOf(Array);

      // Verify all healthcheck parameters (in nanoseconds)
      expect(healthcheckData.Interval).toBe(120 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Timeout).toBe(10 * ONE_SECOND_IN_NANOSECONDS);
      expect(healthcheckData.Retries).toBe(5);
      expect(healthcheckData.StartPeriod).toBe(90 * ONE_SECOND_IN_NANOSECONDS);
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should fail to create a container when name already exists without adopt", async (scope) => {
    const api = new DockerApi();
    const containerName = `${BRANCH_PREFIX}-adopt-test-no-adopt`;

    try {
      // Manually create a container outside of Alchemy
      await api.exec(["create", "--name", containerName, "hello-world:latest"]);

      // Attempt to create a container with the same name without adopt flag
      await expect(
        Container("adopt-test-no-adopt", {
          image: "hello-world:latest",
          name: containerName,
          start: false,
        }),
      ).rejects.toThrow(
        `Container "${containerName}" already exists. Use adopt: true to adopt it.`,
      );
    } finally {
      // Clean up manually created container
      await api.removeContainer(containerName, true);
      await alchemy.destroy(scope);
    }
  });

  test("should adopt an existing container when adopt is true", async (scope) => {
    const api = new DockerApi();
    const containerName = `${BRANCH_PREFIX}-adopt-test-with-adopt`;

    try {
      // Manually create a container outside of Alchemy
      const { stdout } = await api.exec([
        "create",
        "--name",
        containerName,
        "hello-world:latest",
      ]);
      const manualContainerId = stdout.trim();

      // Adopt the existing container
      const container = await Container("adopt-test-with-adopt", {
        image: "hello-world:latest",
        name: containerName,
        adopt: true,
        start: false,
      });

      // Verify the container was adopted (same ID)
      expect(container.id).toBe(manualContainerId);
      expect(container.name).toBe(containerName);
      expect(container.state).toBe("created");
    } finally {
      await alchemy.destroy(scope);

      // Verify container was removed
      const exists = await api.containerExists(containerName);
      expect(exists).toBe(false);
    }
  });

  test("should adopt and start an existing stopped container", async (scope) => {
    const api = new DockerApi();
    const containerName = `${BRANCH_PREFIX}-adopt-test-start`;

    try {
      // Manually create a container outside of Alchemy
      const { stdout } = await api.exec([
        "create",
        "--name",
        containerName,
        "nginx:latest",
      ]);
      const manualContainerId = stdout.trim();

      // Adopt and start the existing container
      const container = await Container("adopt-test-start", {
        image: "nginx:latest",
        name: containerName,
        adopt: true,
        start: true,
      });

      // Verify the container was adopted and started
      expect(container.id).toBe(manualContainerId);
      expect(container.name).toBe(containerName);
      expect(container.state).toBe("running");

      // Verify it's actually running via Docker inspect
      const containerInfos = await api.inspectContainer(containerName);
      const containerInfo = containerInfos[0];
      expect(containerInfo.State.Status).toBe("running");
    } finally {
      await alchemy.destroy(scope);
    }
  });
});
