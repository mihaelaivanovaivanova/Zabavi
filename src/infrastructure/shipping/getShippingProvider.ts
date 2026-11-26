import { isSpeedyDeliveryMethod, type DeliveryMethodId, type ShippingProvider } from "@/domain/shipping/types";
import { BoxNowApiProvider } from "@/infrastructure/shipping/boxNowApiProvider";
import { isBoxNowApiConfigured } from "@/infrastructure/shipping/boxNowApiClient";
import { BoxNowStubProvider } from "@/infrastructure/shipping/boxNowProvider";
import { CourierStubProvider } from "@/infrastructure/shipping/courierProvider";
import { SpeedyApiProvider } from "@/infrastructure/shipping/speedyApiProvider";
import { isSpeedyApiConfigured } from "@/infrastructure/shipping/speedyApiClient";

const stubProviders: Record<DeliveryMethodId, ShippingProvider> = {
  courier: new CourierStubProvider(),
  box_now: new BoxNowStubProvider(),
  speedy_office: new CourierStubProvider(),
  speedy_locker: new CourierStubProvider(),
};

/**
 * Returns the real BOX NOW Partner API / Speedy Web API provider once each
 * one's credentials are configured (see `boxNowApiClient.ts` /
 * `speedyApiClient.ts`); otherwise the demo stub, so the checkout flow
 * stays honest about what it can actually submit. `courier`/`speedy_office`/
 * `speedy_locker` all resolve to the same `SpeedyApiProvider` — see
 * `isSpeedyDeliveryMethod`.
 */
export async function getShippingProvider(method: DeliveryMethodId): Promise<ShippingProvider> {
  if (method === "box_now" && (await isBoxNowApiConfigured())) {
    return new BoxNowApiProvider();
  }
  if (isSpeedyDeliveryMethod(method) && (await isSpeedyApiConfigured())) {
    return new SpeedyApiProvider();
  }
  return stubProviders[method];
}
