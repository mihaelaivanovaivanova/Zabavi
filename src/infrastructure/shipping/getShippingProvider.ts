import type { DeliveryMethodId, ShippingProvider } from "@/domain/shipping/types";
import { BoxNowApiProvider } from "@/infrastructure/shipping/boxNowApiProvider";
import { isBoxNowApiConfigured } from "@/infrastructure/shipping/boxNowApiClient";
import { BoxNowStubProvider } from "@/infrastructure/shipping/boxNowProvider";
import { CourierStubProvider } from "@/infrastructure/shipping/courierProvider";

const stubProviders: Record<DeliveryMethodId, ShippingProvider> = {
  courier: new CourierStubProvider(),
  box_now: new BoxNowStubProvider(),
};

/**
 * Returns the real BOX NOW Partner API provider once OAUTH credentials are
 * configured (see `boxNowApiClient.ts`); otherwise the demo stub, so the
 * checkout flow stays honest about what it can actually submit.
 */
export function getShippingProvider(method: DeliveryMethodId): ShippingProvider {
  if (method === "box_now" && isBoxNowApiConfigured()) {
    return new BoxNowApiProvider();
  }
  return stubProviders[method];
}
