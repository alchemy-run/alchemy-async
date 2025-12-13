import type Stripe from "stripe";
import { beforeAll, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { Card } from "../../src/stripe/card.ts";
import { createStripeClient } from "../../src/stripe/client.ts";
import { Customer } from "../../src/stripe/customer.ts";
import "../../src/test/vitest.ts";

const BRANCH_PREFIX = process.env.BRANCH_PREFIX || "test";

let stripeClient: Stripe;

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Stripe Card Resource", () => {
  beforeAll(async () => {
    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_API_KEY environment variable is required");
    }
    stripeClient = await createStripeClient({ apiKey });
  });

  test("create, update, and delete card", async (scope) => {
    const customerId = `${BRANCH_PREFIX}-customer-1`;
    const cardId = `${BRANCH_PREFIX}-card-1`;

    let customer: Customer | undefined;
    let card: Card | undefined;
    try {
      customer = await Customer(customerId, {
        email: "test@example.com",
        name: "Test Customer for Card",
      });

      card = await Card(cardId, {
        customer: customer.id,
        source: "tok_visa",
        name: "Test Cardholder",
        addressLine1: "123 Test St",
        addressCity: "Test City",
        addressState: "CA",
        addressZip: "12345",
        addressCountry: "US",
        metadata: {
          test: "true",
          branch: BRANCH_PREFIX,
        },
      });

      expect(card.customer).toBe(customer.id);
      expect(card.brand).toBe("Visa");
      expect(card.last4).toBe("4242");

      const stripeCard = (await stripeClient.customers.retrieveSource(
        customer.id,
        card.id,
      )) as Stripe.Card;
      expect(stripeCard.id).toBe(card.id);
      expect(stripeCard.last4).toBe("4242");

      const updatedCard = await Card(cardId, {
        customer: customer.id,
        name: "Updated Test Cardholder",
        metadata: {
          test: "true",
          branch: BRANCH_PREFIX,
          updated: "true",
        },
      });

      expect(updatedCard.name).toBe("Updated Test Cardholder");
    } finally {
      await destroy(scope);

      if (customer && card) {
        try {
          await stripeClient.customers.retrieveSource(customer.id, card.id);
          expect(false).toBe(true);
        } catch (error: any) {
          expect(error.code).toBe("resource_missing");
        }
      }
    }
  });
});
