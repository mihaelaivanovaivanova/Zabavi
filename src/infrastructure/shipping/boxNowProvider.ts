import type { OrderDraft } from "@/domain/order/types";
import type { ShipmentCreationResult, ShippingProvider } from "@/domain/shipping/types";

/**
 * Phase 1 stand-in for the real BOX NOW delivery-request creation
 * (`POST /api/v1/delivery-requests` with `destination.locationId` set to
 * the selected locker's ID). That call requires an OAUTH_CLIENT_ID and
 * OAUTH_CLIENT_SECRET issued by BOX NOW after partner registration
 * (integrationsupport@boxnow.bg) and is never called here.
 *
 * The locker itself is real: it is selected via BOX NOW's public map
 * widget, which talks directly to their production location data without
 * needing any partner credentials. Only the shipment creation is mocked.
 */
export class BoxNowStubProvider implements ShippingProvider {
  readonly method = "box_now" as const;

  async createShipment(order: OrderDraft): Promise<ShipmentCreationResult> {
    const lockerId = order.shippingDetails.method === "box_now" ? order.shippingDetails.lockerId : "unknown";
    return {
      demoNotice: `ДЕМО: тук в продукция BOX NOW би създал пратка към автомат ${lockerId}.`,
    };
  }
}
