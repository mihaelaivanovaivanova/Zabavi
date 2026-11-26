import type { OrderDraft } from "@/domain/order/types";
import type { ShipmentCreationResult, ShippingProvider } from "@/domain/shipping/types";

/**
 * Fallback used whenever the real Speedy Web API isn't configured yet (no
 * username/password/dropoff office — see `speedyApiClient.ts`). Once those
 * credentials are set, `getShippingProvider` returns `SpeedyApiProvider`
 * instead, which actually calls `POST shipment`.
 */
export class CourierStubProvider implements ShippingProvider {
  readonly method = "courier" as const;

  async createShipment(_order: OrderDraft): Promise<ShipmentCreationResult> {
    return {
      isLive: false,
      notice: "ДЕМО: тук в продукция куриер би поел пратката от склада за доставка до адреса.",
    };
  }
}
