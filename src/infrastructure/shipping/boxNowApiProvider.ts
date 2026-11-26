import { calculateTotals } from "@/domain/cart/calculateTotals";
import type { OrderDraft } from "@/domain/order/types";
import { ShippingProviderError, type ShipmentCreationResult, type ShippingProvider } from "@/domain/shipping/types";
import { createBoxNowDeliveryRequest } from "@/infrastructure/shipping/boxNowApiClient";

/**
 * Real BOX NOW Partner API integration (`POST /api/v1/delivery-requests`).
 * `getShippingProvider` only returns this once OAUTH credentials are set —
 * see `boxNowApiClient.ts`.
 */
export class BoxNowApiProvider implements ShippingProvider {
  readonly method = "box_now" as const;

  async createShipment(order: OrderDraft): Promise<ShipmentCreationResult> {
    if (order.shippingDetails.method !== "box_now") {
      throw new ShippingProviderError("BoxNowApiProvider called with a non-BOX NOW shipping method.");
    }

    const totals = await calculateTotals(order.items, {
      paymentMethod: order.paymentMethod,
      deliveryMethod: order.shippingDetails.method,
    });
    if (!totals.isPriceConfirmed || totals.totalEur === null) {
      throw new ShippingProviderError(
        "Истинска BOX NOW пратка не може да бъде създадена без зададена истинска цена на продукта (priceEur е TBD).",
      );
    }

    const result = await createBoxNowDeliveryRequest({
      orderNumber: order.id,
      invoiceValueEur: totals.totalEur,
      paymentMode: order.paymentMethod === "cash_on_delivery" ? "cod" : "prepaid",
      amountToBeCollectedEur: order.paymentMethod === "cash_on_delivery" ? totals.totalEur : 0,
      destinationLockerId: order.shippingDetails.lockerId,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email,
    });

    return {
      isLive: true,
      notice: `Пратка №${result.referenceNumber} е заявена към BOX NOW автомат ${order.shippingDetails.lockerId}.`,
      referenceNumber: result.referenceNumber,
      parcelIds: result.parcelIds,
    };
  }
}
