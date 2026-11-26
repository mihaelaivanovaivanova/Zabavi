import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";

const SHIPPING_PRICES = { box_now: 0, courier: 2.5, speedy_office: 0, speedy_locker: 0 };

describe("CheckoutSummary", () => {
  it("doesn't show a shipping price or call it free before the delivery method is reached (step 1)", () => {
    render(
      <CheckoutSummary
        quantity={1}
        priceEur={44.99}
        deliveryMethod="box_now"
        isCashOnDelivery={false}
        shippingPrices={SHIPPING_PRICES}
        codFeeEur={0.5}
        isShippingKnown={false}
      />,
    );

    expect(screen.getByText("Изчислява се на следващата стъпка")).toBeInTheDocument();
    expect(screen.queryByText("Безплатна")).not.toBeInTheDocument();
    // Total excludes the not-yet-relevant shipping figure: subtotal and total
    // are the same figure here (no COD fee either), so it appears twice.
    expect(screen.getAllByText("44.99 €")).toHaveLength(2);
  });

  it("shows the real shipping price once the delivery method is known (step 2+)", () => {
    render(
      <CheckoutSummary
        quantity={1}
        priceEur={44.99}
        deliveryMethod="courier"
        isCashOnDelivery={false}
        shippingPrices={SHIPPING_PRICES}
        codFeeEur={0.5}
        isShippingKnown
      />,
    );

    expect(screen.getByText("2.50 €")).toBeInTheDocument();
    expect(screen.getByText("47.49 €")).toBeInTheDocument();
  });

  it("shows 'Безплатна' once the delivery method is known and its price is 0", () => {
    render(
      <CheckoutSummary
        quantity={1}
        priceEur={44.99}
        deliveryMethod="box_now"
        isCashOnDelivery={false}
        shippingPrices={SHIPPING_PRICES}
        codFeeEur={0.5}
        isShippingKnown
      />,
    );

    expect(screen.getByText("Безплатна")).toBeInTheDocument();
  });
});
