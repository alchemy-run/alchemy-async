import { describe, expect } from "vitest";
import { alchemy } from "../src/alchemy.ts";
import { BRANCH_PREFIX } from "./util.ts";

import { destroy } from "../src/destroy.ts";
import "../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("alchemy.run", async () => {
  describe("read mode", async () => {
    test("can create a scope", async (scope) => {
      expect(scope.phase).toBe("up");

      await alchemy.run("child", { phase: "read" }, async (child) => {
        expect(child.phase).toBe("read");
        expect(child.appName).toEqual(`${BRANCH_PREFIX}-alchemy.test.ts`);
        expect(child.scopeName).toBe("child");
        expect(child.parent).toBe(scope);
      });
    });
  });
});

describe("simulating CLI behavior via programmatic options", () => {
  test("should error when CLI passes local=true and phase=up (alchemy dev --phase up)", async () => {
    await expect(async () => {
      const app = await alchemy(`${BRANCH_PREFIX}-cli-dev-phase-up`, {
        local: true,
        phase: "up",
      });
      await app.finalize();
    }).rejects.toThrow(/Cannot use phase "up" in dev\/local mode/);
  });

  test("should work when CLI passes local=true and stage=dev (alchemy dev --stage dev)", async () => {
    const app = await alchemy(`${BRANCH_PREFIX}-cli-dev-stage-dev`, {
      local: true,
      stage: "dev",
      phase: "read",
    });

    expect(app).toBeDefined();
    expect(app.local).toBe(true);
    expect(app.stage).toBe("dev");
    expect(app.phase).toBe("read");

    await app.finalize();
    await destroy(app);
  });

  test("should work when CLI passes only stage=up (alchemy deploy --stage up)", async () => {
    const app = await alchemy(`${BRANCH_PREFIX}-cli-only-stage-up`, {
      stage: "up",
    });

    expect(app).toBeDefined();
    expect(app.local).toBe(false);
    expect(app.stage).toBe("up");

    await app.finalize();
    await destroy(app);
  });

  test("should work when CLI passes local=false and stage=up (alchemy deploy --stage up)", async () => {
    const app = await alchemy(`${BRANCH_PREFIX}-cli-deploy-stage-up`, {
      local: false,
      stage: "up",
    });

    expect(app).toBeDefined();
    expect(app.local).toBe(false);
    expect(app.stage).toBe("up");

    await app.finalize();
    await destroy(app);
  });
});
