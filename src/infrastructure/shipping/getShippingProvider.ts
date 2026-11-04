import type { DeliveryMethodId, ShippingProvider } from "@/domain/shipping/types";
import { BoxNowStubProvider } from "@/infrastructure/shipping/boxNowProvider";
import { CourierStubProvider } from "@/infrastructure/shipping/courierProvider";

const providers: Record<DeliveryMethodId, ShippingProvider> = {
  courier: new CourierStubProvider(),
  box_now: new BoxNowStubProvider(),
};

export function getShippingProvider(method: DeliveryMethodId): ShippingProvider {
  return providers[method];
}
