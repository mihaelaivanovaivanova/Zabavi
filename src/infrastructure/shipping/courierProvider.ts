import type { OrderDraft } from "@/domain/order/types";
import type { ShipmentCreationResult, ShippingProvider } from "@/domain/shipping/types";

export class CourierStubProvider implements ShippingProvider {
  readonly method = "courier" as const;

  async createShipment(_order: OrderDraft): Promise<ShipmentCreationResult> {
    return {
      demoNotice: "ДЕМО: тук в продукция куриер би поел пратката от склада за доставка до адреса.",
    };
  }
}
