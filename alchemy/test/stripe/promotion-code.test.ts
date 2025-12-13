import type Stripe from "stripe";
import { beforeAll, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createStripeClient } from "../../src/stripe/client.ts";
import { Coupon } from "../../src/stripe/coupon.ts";
import { PromotionCode } from "../../src/stripe/promotion-code.ts";
import "../../src/test/vitest.ts";

const BRANCH_PREFIX = process.env.BRANCH_PREFIX || "test";

let stripeClient: Stripe;

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Stripe PromotionCode Resource", () => {
  beforeAll(async () => {
    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_API_KEY environment variable is required");
    }
    stripeClient = await createStripeClient({ apiKey });
  });

  test("create, update, and deactivate promotion code", async (scope) => {
    const couponId = `${BRANCH_PREFIX}-coupon-test-1`;
    const promotionCodeId = `${BRANCH_PREFIX}-promo-test-1`;
    let coupon: Coupon | undefined;
    let promotionCode: PromotionCode | undefined;
    try {
      coupon = await Coupon(couponId, {
        id: couponId,
        duration: "once",
        percentOff: 20,
        name: "Test Coupon for Promo",
      });

      promotionCode = await PromotionCode(promotionCodeId, {
        coupon: coupon.id,
        code: "TESTCODE123",
        active: true,
        maxRedemptions: 100,
        metadata: {
          test: "true",
          branch: BRANCH_PREFIX,
        },
      });

      expect(promotionCode.coupon).toBe(coupon.id);
      expect(promotionCode.active).toBe(true);
      expect(promotionCode.maxRedemptions).toBe(100);

      const stripePromotionCode = await stripeClient.promotionCodes.retrieve(
        promotionCode.id,
      );
      expect(stripePromotionCode.id).toBe(promotionCode.id);
      expect(stripePromotionCode.active).toBe(true);

      promotionCode = await PromotionCode(promotionCodeId, {
        coupon: coupon.id,
        code: promotionCode.code,
        active: false,
        maxRedemptions: 100,
        metadata: {
          test: "true",
          branch: BRANCH_PREFIX,
          updated: "true",
        },
      });

      expect(promotionCode.active).toBe(false);
    } finally {
      await destroy(scope);

      if (promotionCode) {
        const deactivatedPromotionCode =
          await stripeClient.promotionCodes.retrieve(promotionCode.id);
        expect(deactivatedPromotionCode.active).toBe(false);
      }
    }
  });
});
