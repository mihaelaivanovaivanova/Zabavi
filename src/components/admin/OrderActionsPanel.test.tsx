import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderActionsPanel } from "@/components/admin/OrderActionsPanel";

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  refreshMock.mockReset();
  pushMock.mockReset();
});

describe("OrderActionsPanel", () => {
  it("only offers the order's own allowed next statuses", () => {
    render(<OrderActionsPanel orderId="order-1" allowedStatuses={["paid", "cancelled"]} hasTrackingNumber={false} />);

    expect(screen.getByRole("option", { name: "Платена" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Отказана" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Доставена" })).not.toBeInTheDocument();
  });

  it("submits the chosen status and note, then refreshes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderActionsPanel orderId="order-1" allowedStatuses={["paid"]} hasTrackingNumber={false} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "paid" } });
    fireEvent.change(screen.getByLabelText("Бележка (незадължително)"), { target: { value: "Платено в брой" } });
    fireEvent.click(screen.getByRole("button", { name: "Промени статуса" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/orders/order-1/status",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ status: "paid", note: "Платено в брой" });
  });

  it("offers 'Създай пратка' instead of label/cancel when there is no tracking number", () => {
    render(<OrderActionsPanel orderId="order-1" allowedStatuses={[]} hasTrackingNumber={false} />);
    expect(screen.queryByRole("button", { name: "Анулирай пратката" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Изтегли етикет" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Създай пратка" })).toBeInTheDocument();
  });

  it("creates the shipment and refreshes on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderActionsPanel orderId="order-1" allowedStatuses={[]} hasTrackingNumber={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Създай пратка" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/orders/order-1/shipment/create",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the real error when creating the shipment fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Speedy credentials are not configured." }), { status: 502 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderActionsPanel orderId="order-1" allowedStatuses={[]} hasTrackingNumber={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Създай пратка" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Speedy credentials are not configured."));
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("cancels the shipment after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderActionsPanel orderId="order-1" allowedStatuses={[]} hasTrackingNumber={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Анулирай пратката" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/orders/order-1/shipment/cancel",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not delete without confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderActionsPanel orderId="order-1" allowedStatuses={[]} hasTrackingNumber={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Изтрий поръчката" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deletes the order and navigates back to the admin list after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { deleted: true } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderActionsPanel orderId="order-1" allowedStatuses={[]} hasTrackingNumber={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Изтрий поръчката" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/orders/order-1", expect.objectContaining({ method: "DELETE" }));
  });
});
