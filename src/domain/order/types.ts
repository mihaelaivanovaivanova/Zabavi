import type { CartLineItem } from "@/domain/cart/types";
import type { PaymentMethodId, PaymentStatus } from "@/domain/payment/types";
import type { ShippingDetails } from "@/domain/shipping/types";

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email?: string;
}

export interface OrderDraft {
  id: string;
  customer: OrderCustomer;
  /** Captured server-side from the request at checkout time; iCard's IPGPurchase requires it. Never client-submitted. */
  customerIp?: string;
  /** Billing address, distinct from `shippingDetails` — required by iCard regardless of delivery method. */
  billingAddress?: { address: string; city: string; postalCode: string };
  shippingDetails: ShippingDetails;
  giftMessage?: string;
  items: CartLineItem[];
  paymentMethod: PaymentMethodId;
  status: OrderStatus;
  /** Separate from `status`: an order can be "confirmed" while payment is still "pending" (cash on delivery). */
  paymentStatus?: PaymentStatus;
  createdAt: string;
}
