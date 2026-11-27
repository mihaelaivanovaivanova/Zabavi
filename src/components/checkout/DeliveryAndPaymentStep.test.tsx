import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { DeliveryAndPaymentStep } from "@/components/checkout/DeliveryAndPaymentStep";
import type { CheckoutFormValues } from "@/lib/validation";

const DEFAULT_VALUES = {
  deliveryMethod: "box_now",
  paymentMethod: "card_icard",
  boxNowLockerId: "",
  boxNowLockerAddressLine1: "",
  boxNowLockerPostalCode: "",
  speedyOfficeId: "",
  speedyOfficeLabel: "",
  speedyOfficeCity: "",
  address: "",
  city: "",
  postalCode: "",
  wantsInvoice: false,
} as CheckoutFormValues;

function Harness({ initial = DEFAULT_VALUES }: { initial?: Partial<CheckoutFormValues> }) {
  const { register, formState, watch, setValue } = useForm<CheckoutFormValues>({
    defaultValues: { ...DEFAULT_VALUES, ...initial },
  });
  return (
    <DeliveryAndPaymentStep
      register={register}
      errors={formState.errors}
      watch={watch}
      setValue={setValue}
      codFeeEur={0.5}
      shippingPrices={{ box_now: 0, courier: 0, speedy_office: 0, speedy_locker: 0 }}
    />
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ lockers: [], settlements: [], offices: [] }), { status: 200 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DeliveryAndPaymentStep", () => {
  it("shows the payment method section before the delivery method section", () => {
    render(<Harness />);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(headings.indexOf("Начин на плащане")).toBeLessThan(headings.indexOf("Начин на доставка"));
  });

  it("disables the BOX NOW delivery option while cash on delivery is selected", () => {
    render(<Harness initial={{ paymentMethod: "cash_on_delivery", deliveryMethod: "speedy_office" }} />);

    expect(screen.getByRole("radio", { name: /BOX NOW/ })).toBeDisabled();
  });

  it("does not disable the cash-on-delivery payment option regardless of the current delivery method", () => {
    render(<Harness initial={{ deliveryMethod: "box_now" }} />);

    expect(screen.getByRole("radio", { name: /Наложен платеж/ })).not.toBeDisabled();
  });

  it("switches the delivery method away from BOX NOW when cash on delivery is chosen", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("radio", { name: /Наложен платеж/ }));

    expect(screen.getByRole("radio", { name: /BOX NOW/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /BOX NOW/ })).toBeDisabled();
  });

  it("does not show the invoice company/VAT fields until 'Искам фактура' is checked", () => {
    render(<Harness />);

    expect(screen.queryByLabelText("Фирма")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Искам фактура/ }));
    expect(screen.getByLabelText("Фирма")).toBeInTheDocument();
    expect(screen.getByLabelText("ДДС номер")).toBeInTheDocument();
  });

  it("shows no separate billing address section for courier delivery, even with an invoice requested", () => {
    render(<Harness initial={{ deliveryMethod: "courier" }} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /Искам фактура/ }));

    expect(screen.queryByRole("heading", { name: "Адрес за фактуриране" })).not.toBeInTheDocument();
  });

  it("shows a billing address section for BOX NOW once an invoice is requested", () => {
    render(<Harness initial={{ deliveryMethod: "box_now", paymentMethod: "cash_on_delivery" }} />);

    expect(screen.queryByRole("heading", { name: "Адрес за фактуриране" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Искам фактура/ }));
    expect(screen.getByRole("heading", { name: "Адрес за фактуриране" })).toBeInTheDocument();
  });

  it("shows a billing address section for BOX NOW with card payment regardless of the invoice checkbox", () => {
    render(<Harness initial={{ deliveryMethod: "box_now", paymentMethod: "card_icard" }} />);

    expect(screen.getByRole("heading", { name: "Адрес за фактуриране" })).toBeInTheDocument();
  });
});
