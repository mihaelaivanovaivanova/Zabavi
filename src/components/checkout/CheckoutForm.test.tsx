import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CartProvider } from "@/lib/CartContext";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

const DEFAULT_PRICING = { shippingPrices: { box_now: 0, courier: 0, speedy_office: 0, speedy_locker: 0 }, codFeeEur: 0.5 };
const DEFAULT_LOCKERS = [{ id: "LOCKER-1721", city: "София", addressLine1: "бул. Тест 1", postalCode: "1000", name: "Тест локер" }];
const DEFAULT_SETTLEMENTS = [{ id: "1", type: "гр.", name: "Варна", municipality: "Варна", region: "Варна", postalCode: "9000" }];

function mockFetchForCheckout(checkoutResponse: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/kits")) {
        return Promise.resolve(new Response(JSON.stringify({ kits: [] }), { status: 200 }));
      }
      if (url.includes("/api/checkout/pricing")) {
        return Promise.resolve(new Response(JSON.stringify(DEFAULT_PRICING), { status: 200 }));
      }
      if (url.includes("/api/box-now/lockers")) {
        return Promise.resolve(new Response(JSON.stringify({ lockers: DEFAULT_LOCKERS }), { status: 200 }));
      }
      if (url.includes("/api/content/settlements")) {
        return Promise.resolve(new Response(JSON.stringify({ settlements: DEFAULT_SETTLEMENTS }), { status: 200 }));
      }
      if (url.includes("/api/checkout")) {
        return Promise.resolve(new Response(JSON.stringify(checkoutResponse), { status: 200 }));
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    }),
  );
}

function fillStep1() {
  fireEvent.input(screen.getByLabelText("Име"), { target: { value: "Иван" } });
  fireEvent.input(screen.getByLabelText("Фамилия"), { target: { value: "Иванов" } });
  fireEvent.input(screen.getByLabelText("Телефон"), { target: { value: "0888123456" } });
  fireEvent.input(screen.getByLabelText("Имейл"), { target: { value: "ivan@example.com" } });
}

// Each native-<select>-based picker's <select> is a sibling of its own
// search input within the same wrapper div, so scoping to that wrapper
// avoids grabbing another picker's <select> when more than one is mounted.
async function selectFromSiblingDropdown(searchInput: HTMLElement, value: string) {
  const wrapper = searchInput.closest("div");
  if (!wrapper) throw new Error("search input has no wrapper div");
  const select = await waitFor(() => {
    const element = wrapper.querySelector("select");
    if (!element) throw new Error("<select> not rendered yet");
    return element;
  });
  fireEvent.change(select, { target: { value } });
}

// SearchableSelect (BOX NOW's city/locker cascade) opens its option list on
// focus and selects via a plain button click, not a native <select>.
async function selectFromSearchableSelect(labelText: string, optionName: string) {
  fireEvent.focus(screen.getByLabelText(labelText));
  const option = await screen.findByRole("option", { name: optionName });
  fireEvent.click(option);
}

async function selectBoxNowLocker() {
  await selectFromSearchableSelect("Град", "София");
  await selectFromSearchableSelect("Автомат", "Тест локер — бул. Тест 1");
}

// box_now only ever pairs with card_icard (the other payment method, cash on
// delivery, is blocked for BOX NOW) — and card_icard always requires a
// billing address regardless of delivery method, so this fills that in too.
async function fillBoxNowBillingAddress() {
  fireEvent.input(screen.getByLabelText("Адрес"), { target: { value: "ул. Примерна 1" } });
  const citySearchInput = screen.getByLabelText("Населено място");
  fireEvent.input(citySearchInput, { target: { value: "Варна" } });
  await selectFromSiblingDropdown(citySearchInput, "1");
  fireEvent.input(screen.getByLabelText("Пощенски код"), { target: { value: "9000" } });
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
    mockFetchForCheckout({ success: true });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    // The variant/quantity picked on the product page are no longer
    // editable in checkout — only shown read-only in the summary sidebar.
    await waitFor(() => expect(screen.getByText("Извън очертанията")).toBeInTheDocument());
    expect(screen.getByText("× 3")).toBeInTheDocument();
  });

  it("defaults to the first variant and qty 1 when the cart is empty", async () => {
    mockFetchForCheckout({ success: true });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByText("Магията на Коледа")).toBeInTheDocument());
    expect(screen.getByText("× 1")).toBeInTheDocument();
  });
});

describe("CheckoutForm — wizard", () => {
  it("walks through all 4 steps and clears the cart once the order is submitted successfully", async () => {
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));
    mockFetchForCheckout({
      success: true,
      orderId: "order-123",
      paymentNotice: "Плащане в брой при доставка.",
      shippingNotice: "Пратката е заявена.",
      paymentIsLive: false,
      shippingIsLive: false,
    });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    await waitFor(() => expect(window.localStorage.getItem("zabavi-cart")).not.toBeNull());
    fillStep1();

    fireEvent.click(screen.getByRole("button", { name: "Напред" }));
    await waitFor(() => expect(screen.getByLabelText("Град")).toBeInTheDocument());
    await selectBoxNowLocker();
    await fillBoxNowBillingAddress();

    fireEvent.click(screen.getByRole("button", { name: "Напред" }));
    await waitFor(() => expect(screen.getByText("Преглед на поръчката")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Завърши поръчката" }));

    await waitFor(() => expect(screen.getByText("Поръчката е получена")).toBeInTheDocument());
    expect(window.localStorage.getItem("zabavi-cart")).toBeNull();
  });

  it("does not advance past step 1 when required fields are missing", async () => {
    mockFetchForCheckout({ success: true });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Напред" }));

    await waitFor(() => expect(screen.getByText("Въведи име.")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Данни за поръчката" })).toBeInTheDocument();
  });

  it("keeps the cart untouched and shows an error when the order submission fails", async () => {
    window.localStorage.setItem("zabavi-cart", JSON.stringify({ variantId: "christmas-magic", quantity: 1 }));
    mockFetchForCheckout({ success: false });

    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>,
    );

    await waitFor(() => expect(window.localStorage.getItem("zabavi-cart")).not.toBeNull());
    fillStep1();

    fireEvent.click(screen.getByRole("button", { name: "Напред" }));
    await waitFor(() => expect(screen.getByLabelText("Град")).toBeInTheDocument());
    await selectBoxNowLocker();
    await fillBoxNowBillingAddress();

    fireEvent.click(screen.getByRole("button", { name: "Напред" }));
    await waitFor(() => expect(screen.getByText("Преглед на поръчката")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Завърши поръчката" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(window.localStorage.getItem("zabavi-cart")).not.toBeNull();
  });
});
