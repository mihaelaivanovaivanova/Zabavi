import type { CartLineItem } from "@/domain/cart/types";
import type { PaymentMethodId } from "@/domain/payment/types";
import type { DeliveryMethodId } from "@/domain/shipping/types";

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email?: string;
}

export interface OrderShippingAddress {
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderDraft {
  id: string;
  customer: OrderCustomer;
  shippingAddress: OrderShippingAddress;
  deliveryMethod: DeliveryMethodId;
  giftMessage?: string;
  items: CartLineItem[];
  paymentMethod: PaymentMethodId;
  status: OrderStatus;
  createdAt: string;
}
