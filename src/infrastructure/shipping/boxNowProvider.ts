import type { OrderDraft } from "@/domain/order/types";
import type { ShipmentCreationResult, ShippingProvider } from "@/domain/shipping/types";

/**
 * Fallback used whenever the real BOX NOW Partner API isn't configured yet
 * (no OAUTH_CLIENT_ID/SECRET — see `boxNowApiClient.ts`). Once partner
 * credentials are set, `getShippingProvider` returns `BoxNowApiProvider`
 * instead, which actually calls `POST /api/v1/delivery-requests`.
 *
 * The locker itself is always real: it is selected via BOX NOW's public
 * map widget, which talks directly to their production location data
 * without needing any partner credentials. Only the shipment creation is
 * mocked here.
 */
export class BoxNowStubProvider implements ShippingProvider {
  readonly method = "box_now" as const;

  async createShipment(order: OrderDraft): Promise<ShipmentCreationResult> {
    const lockerId = order.shippingDetails.method === "box_now" ? order.shippingDetails.lockerId : "unknown";
    return {
      isLive: false,
      notice: `ДЕМО: тук в продукция BOX NOW би създал пратка към автомат ${lockerId}.`,
    };
  }
}
