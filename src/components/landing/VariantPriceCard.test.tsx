import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VariantPriceCard } from "@/components/landing/VariantPriceCard";
import type { ProductVariant } from "@/domain/product/types";

const plainVariant: ProductVariant = { id: "calm-moments", label: "Извън очертанията" };

const richVariant: ProductVariant = {
  id: "christmas-magic",
  label: "Магията на Коледа",
  badge: "Лимитирано",
  intro: "Коледа. Вълшебство.",
  contents: ["4 авторски картички", "1 бр. щипка"],
  bonus: ["4 мини принта", "QR код с видео"],
};

describe("VariantPriceCard", () => {
  it("shows the discount badge and crossed-out price only when both prices are confirmed and discounted", () => {
    render(
      <VariantPriceCard
        variant={plainVariant}
        priceEur={44.99}
        compareAtPriceEur={57.99}
        active
        onSelect={() => {}}
        quantity={1}
        onQuantityChange={() => {}}
      />,
    );

    expect(screen.getByText("-22%")).toBeInTheDocument();
    expect(screen.getByText("57.99 €")).toBeInTheDocument();
    expect(screen.getByText("44.99 €")).toBeInTheDocument();
  });

  it("hides the discount badge when there is no compare-at price", () => {
    render(
      <VariantPriceCard
        variant={plainVariant}
        priceEur={44.99}
        compareAtPriceEur={null}
        active
        onSelect={() => {}}
        quantity={1}
        onQuantityChange={() => {}}
      />,
    );

    expect(screen.queryByText(/^-\d+%$/)).not.toBeInTheDocument();
  });

  it("never shows contents, bonus or the quantity stepper while the card is inactive", () => {
    render(
      <VariantPriceCard
        variant={richVariant}
        priceEur={44.99}
        compareAtPriceEur={null}
        active={false}
        onSelect={() => {}}
        quantity={1}
        onQuantityChange={() => {}}
      />,
    );

    expect(screen.queryByText("Получаваш:")).not.toBeInTheDocument();
    expect(screen.queryByText("Бонус:")).not.toBeInTheDocument();
    expect(screen.queryByText("Брой кутии")).not.toBeInTheDocument();
  });

  it("shows intro, contents and bonus once active, for a variant that has them", () => {
    render(
      <VariantPriceCard
        variant={richVariant}
        priceEur={44.99}
        compareAtPriceEur={null}
        active
        onSelect={() => {}}
        quantity={1}
        onQuantityChange={() => {}}
      />,
    );

    expect(screen.getByText("Коледа. Вълшебство.")).toBeInTheDocument();
    expect(screen.getByText("Получаваш:")).toBeInTheDocument();
    expect(screen.getByText("4 авторски картички")).toBeInTheDocument();
    expect(screen.getByText("Бонус:")).toBeInTheDocument();
    expect(screen.getByText("QR код с видео")).toBeInTheDocument();
  });

  it("omits the contents/bonus sections for a variant without them, even when active", () => {
    render(
      <VariantPriceCard
        variant={plainVariant}
        priceEur={44.99}
        compareAtPriceEur={null}
        active
        onSelect={() => {}}
        quantity={1}
        onQuantityChange={() => {}}
      />,
    );

    expect(screen.queryByText("Получаваш:")).not.toBeInTheDocument();
    expect(screen.queryByText("Бонус:")).not.toBeInTheDocument();
  });

  it("calls onSelect when an inactive card's radio is picked", () => {
    const onSelect = vi.fn();
    render(
      <VariantPriceCard
        variant={plainVariant}
        priceEur={44.99}
        compareAtPriceEur={null}
        active={false}
        onSelect={onSelect}
        quantity={1}
        onQuantityChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("radio"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onQuantityChange from the stepper on an active card", () => {
    const onQuantityChange = vi.fn();
    render(
      <VariantPriceCard
        variant={plainVariant}
        priceEur={44.99}
        compareAtPriceEur={null}
        active
        onSelect={() => {}}
        quantity={1}
        onQuantityChange={onQuantityChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Увеличи количеството" }));
    expect(onQuantityChange).toHaveBeenCalledWith(2);
  });
});
