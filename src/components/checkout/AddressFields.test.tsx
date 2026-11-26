import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import type { CheckoutFormValues } from "@/lib/validation";

const SETTLEMENTS = [{ id: "1", type: "гр.", name: "Варна", municipality: "Варна", region: "Варна", postalCode: "9000" }];
const DEFAULT_VALUES = { address: "", city: "", postalCode: "" } as CheckoutFormValues;

function mockSettlementsFetch() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ settlements: SETTLEMENTS }), { status: 200 })));
}

beforeEach(() => {
  // useSettlements (via SettlementPicker) caches its result at module scope
  // for the page's whole lifetime — reset it between tests.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderAddressFields(props: { title?: string; addressLabel?: string } = {}) {
  const { AddressFields } = await import("@/components/checkout/AddressFields");

  function Harness() {
    const { register, formState, watch, setValue } = useForm<CheckoutFormValues>({ defaultValues: DEFAULT_VALUES });
    return <AddressFields register={register} errors={formState.errors} watch={watch} setValue={setValue} {...props} />;
  }

  return render(<Harness />);
}

describe("AddressFields", () => {
  it("renders the settlement picker and the address field, without a separate postal code field", async () => {
    mockSettlementsFetch();
    await renderAddressFields();

    expect(screen.getByLabelText("Населено място")).toBeInTheDocument();
    expect(screen.getByLabelText("Адрес")).toBeInTheDocument();
    expect(screen.queryByLabelText("Пощенски код")).not.toBeInTheDocument();
  });

  it("uses the given addressLabel for the free-text field", async () => {
    mockSettlementsFetch();
    await renderAddressFields({ addressLabel: "Адрес за доставка" });

    expect(screen.getByLabelText("Адрес за доставка")).toBeInTheDocument();
  });

  it("shows the title heading when one is given", async () => {
    mockSettlementsFetch();
    await renderAddressFields({ title: "Адрес за фактуриране" });

    expect(screen.getByRole("heading", { name: "Адрес за фактуриране" })).toBeInTheDocument();
  });

  it("fills in the postal code silently from the chosen settlement", async () => {
    mockSettlementsFetch();
    const { AddressFields } = await import("@/components/checkout/AddressFields");

    function Harness() {
      const { register, formState, watch, setValue } = useForm<CheckoutFormValues>({ defaultValues: DEFAULT_VALUES });
      return (
        <div>
          <AddressFields register={register} errors={formState.errors} watch={watch} setValue={setValue} />
          <span data-testid="postal-code-probe">{watch("postalCode")}</span>
        </div>
      );
    }
    render(<Harness />);

    fireEvent.focus(screen.getByLabelText("Населено място"));
    await waitFor(() => expect(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "гр. Варна (общ. Варна, обл. Варна)" }));

    await waitFor(() => expect(screen.getByTestId("postal-code-probe")).toHaveTextContent("9000"));
  });
});
