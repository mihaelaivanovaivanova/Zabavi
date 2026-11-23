import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CartProvider } from "@/lib/CartContext";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

function mockFetchForKitsAndCheckout(checkoutResponse: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/kits")) {
        return Promise.resolve(new Response(JSON.stringify({ kits: [] }), { status: 200 }));
      }
      if (url.includes("/api/checkout")) {
        return Promise.resolve(new Response(JSON.stringify(checkoutResponse), { status: 200 }));
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    }),
  );
}

function fillRequiredFields() {
  fireEvent.input(screen.getByLabelText("Име и фамилия"), { target: { value: "Иван Иванов" } });
  fireEvent.input(screen.getByLabelText("Телефон"), { target: { value: "0888123456" } });
  fireEvent.input(screen.getByLabelText("Адрес"), { target: { value: "ул. Примерна 1" } });
  fireEvent.input(screen.getByLabelText("Град"), { target: { value: "София" } });
  fireEvent.input(screen.getByLabelText("Пощенски код"), { target: { value: "1000" } });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CheckoutForm — cart integration", () => {
  it("prefills the variant and quantity from the cart instead of defaulting to the first variant and qty 1", async () => {
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "calm-moments", quantity: 3 }));
    mockFetchForKitsAndCheckout({ success: true });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByRole("radio", { name: "Извън очертанията" })).toBeChecked());
    expect(screen.getByLabelText("Брой кутии")).toHaveValue(3);
  });

  it("defaults to the first variant and qty 1 when the cart is empty", async () => {
    mockFetchForKitsAndCheckout({ success: true });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByRole("radio", { name: "Магията на Коледа" })).toBeChecked());
    expect(screen.getByLabelText("Брой кутии")).toHaveValue(1);
  });

  it("clears the cart once the demo order is submitted successfully", async () => {
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));
    mockFetchForKitsAndCheckout({
      success: true,
      orderId: "order-123",
      paymentNotice: "Демо плащане.",
      shippingNotice: "Демо доставка.",
      paymentIsLive: false,
      shippingIsLive: false,
    });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    await waitFor(() => expect(window.localStorage.getItem("zabavi-cart")).not.toBeNull());
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Завърши поръчката (демо)" }));

    await waitFor(() => expect(screen.getByText("Демонстрацията е завършена")).toBeInTheDocument());
    expect(window.localStorage.getItem("zabavi-cart")).toBeNull();
  });

  it("keeps the cart untouched when the order submission fails", async () => {
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));
    mockFetchForKitsAndCheckout({ success: false });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    await waitFor(() => expect(window.localStorage.getItem("zabavi-cart")).not.toBeNull());
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Завърши поръчката (демо)" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(window.localStorage.getItem("zabavi-cart")).not.toBeNull();
  });
});
