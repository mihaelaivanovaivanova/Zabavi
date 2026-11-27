import { calculateTotals } from "@/domain/cart/calculateTotals";
import type { OrderDraft } from "@/domain/order/types";
import {
  ShippingProviderError,
  isSpeedyDeliveryMethod,
  type ShipmentCreationResult,
  type ShippingProvider,
} from "@/domain/shipping/types";
import { createSpeedyShipment, type CreateSpeedyShipmentDestination } from "@/infrastructure/shipping/speedyApiClient";

function destinationFor(order: OrderDraft): CreateSpeedyShipmentDestination {
  const details = order.shippingDetails;
  if (details.method === "speedy_office" || details.method === "speedy_locker") {
    return { type: "office", officeId: details.officeId };
  }
  if (details.method === "courier") {
    return { type: "address", address: details.address, city: details.city, postalCode: details.postalCode };
  }
  throw new ShippingProviderError("SpeedyApiProvider called with a non-Speedy shipping method.");
}

/**
 * Real Speedy Web API integration (`POST shipment`). `getShippingProvider`
 * only returns this once Speedy credentials are configured — see
 * `speedyApiClient.ts`. Handles all three Speedy delivery variants
 * (to address, staffed office, automated machine/APT).
 */
export class SpeedyApiProvider implements ShippingProvider {
  readonly method = "courier" as const;

  async createShipment(order: OrderDraft): Promise<ShipmentCreationResult> {
    if (!isSpeedyDeliveryMethod(order.shippingDetails.method)) {
      throw new ShippingProviderError("SpeedyApiProvider called with a non-Speedy shipping method.");
    }

    const totals = await calculateTotals(order.items, {
      paymentMethod: order.paymentMethod,
      deliveryMethod: order.shippingDetails.method,
    });
    if (!totals.isPriceConfirmed || totals.totalEur === null) {
      throw new ShippingProviderError(
        "Истинска Speedy пратка не може да бъде създадена без зададена истинска цена на продукта (priceEur е TBD).",
      );
    }

    const destination = destinationFor(order);
    const result = await createSpeedyShipment({
      // Speedy's `ref1` field is capped at 30 characters — the human
      // readable orderNumber ("ZB-261127-A4F2") fits; order.id (a full
      // UUID) does not, and was rejected live with
      // "Реф1: Максималната позволена дължина е 30". Mirrors smisul.bg's
      // own `'ref1' => $order->order_number`.
      orderNumber: order.orderNumber ?? order.id,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      destination,
      paymentMethod: order.paymentMethod === "cash_on_delivery" ? "cod" : "prepaid",
      amountToCollectEur: order.paymentMethod === "cash_on_delivery" ? totals.totalEur : 0,
    });

    const destinationLabel = destination.type === "office" ? "офис/автомат на Speedy" : `адрес в ${destination.city}`;

    return {
      isLive: true,
      notice: `Пратка №${result.trackingNumber} е заявена към Speedy за ${destinationLabel}.`,
      referenceNumber: result.trackingNumber,
    };
  }
}
