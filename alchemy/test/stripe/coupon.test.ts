import type Stripe from "stripe";
import { beforeAll, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createStripeClient } from "../../src/stripe/client.ts";
import { Coupon } from "../../src/stripe/coupon.ts";
import "../../src/test/vitest.ts";

const BRANCH_PREFIX = process.env.BRANCH_PREFIX || "test";

let stripeClient: Stripe;

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Stripe Coupon Resource", () => {
  beforeAll(async () => {
    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_API_KEY environment variable is required");
    }
    stripeClient = await createStripeClient({ apiKey });
  });

  test("create, update, and delete coupon", async (scope) => {
    const couponId = `${BRANCH_PREFIX}-coupon-test`;

    let coupon: Coupon | undefined;
    try {
      coupon = await Coupon(couponId, {
        id: couponId,
        duration: "once",
        percentOff: 25,
        name: "Test Coupon",
        metadata: {
          test: "true",
          branch: BRANCH_PREFIX,
        },
      });

      expect(coupon).toMatchObject({
        id: couponId,
        duration: "once",
        percentOff: 25,
        name: "Test Coupon",
      });

      const stripeCoupon = await stripeClient.coupons.retrieve(coupon.id);
      expect(stripeCoupon.id).toBe(coupon.id);
      expect(stripeCoupon.percent_off).toBe(25);

      coupon = await Coupon(couponId, {
        id: couponId,
        duration: "once",
        percentOff: 25,
        name: "Updated Test Coupon",
        metadata: {
          test: "true",
          branch: BRANCH_PREFIX,
          updated: "true",
        },
      });

      expect(coupon).toMatchObject({
        name: "Updated Test Coupon",
        metadata: expect.objectContaining({
          updated: "true",
        }),
      });
    } finally {
      await destroy(scope);

      if (coupon) {
        try {
          await stripeClient.coupons.retrieve(coupon.id);
          expect(false).toBe(true);
        } catch (error: any) {
          expect(error.code).toBe("resource_missing");
        }
      }
    }
  });
});
