import { calculateTotals } from "@/domain/cart/calculateTotals";
import type { OrderDraft } from "@/domain/order/types";
import { ShippingProviderError, type ShipmentCreationResult, type ShippingProvider } from "@/domain/shipping/types";
import { createSpeedyShipment } from "@/infrastructure/shipping/speedyApiClient";

/**
 * Real Speedy Web API integration (`POST shipment`). `getShippingProvider`
 * only returns this once Speedy credentials are configured — see
 * `speedyApiClient.ts`.
 */
export class SpeedyApiProvider implements ShippingProvider {
  readonly method = "courier" as const;

  async createShipment(order: OrderDraft): Promise<ShipmentCreationResult> {
    if (order.shippingDetails.method !== "courier") {
      throw new ShippingProviderError("SpeedyApiProvider called with a non-courier shipping method.");
    }

    const totals = await calculateTotals(order.items, { paymentMethod: order.paymentMethod });
    if (!totals.isPriceConfirmed || totals.totalEur === null) {
      throw new ShippingProviderError(
        "Истинска Speedy пратка не може да бъде създадена без зададена истинска цена на продукта (priceEur е TBD).",
      );
    }

    const result = await createSpeedyShipment({
      orderNumber: order.id,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      address: order.shippingDetails.address,
      city: order.shippingDetails.city,
      postalCode: order.shippingDetails.postalCode,
      paymentMethod: order.paymentMethod === "cash_on_delivery" ? "cod" : "prepaid",
      amountToCollectEur: order.paymentMethod === "cash_on_delivery" ? totals.totalEur : 0,
    });

    return {
      isLive: true,
      notice: `Пратка №${result.trackingNumber} е заявена към Speedy за адрес в ${order.shippingDetails.city}.`,
      referenceNumber: result.trackingNumber,
    };
  }
}
