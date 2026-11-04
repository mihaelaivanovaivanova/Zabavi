import type { CartLineItem } from "@/domain/cart/types";
import type { PaymentMethodId } from "@/domain/payment/types";
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
  shippingDetails: ShippingDetails;
  giftMessage?: string;
  items: CartLineItem[];
  paymentMethod: PaymentMethodId;
  status: OrderStatus;
  createdAt: string;
}
