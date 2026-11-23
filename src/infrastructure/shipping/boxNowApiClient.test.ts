import { afterEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV = {
  BOXNOW_API_URL: "https://partner-api.boxnow.bg",
  BOXNOW_OAUTH_CLIENT_ID: "test-client-id",
  BOXNOW_OAUTH_CLIENT_SECRET: "test-client-secret",
  BOXNOW_ORIGIN_LOCATION_ID: "origin-location-1",
  BOXNOW_ORIGIN_CONTACT_NAME: "ЗАБАВЍ Склад",
  BOXNOW_ORIGIN_CONTACT_EMAIL: "warehouse@zabavi.example",
  BOXNOW_ORIGIN_CONTACT_NUMBER: "+359888000000",
};

function stubRequiredEnv() {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("isBoxNowApiConfigured", () => {
  it("returns false when no credentials are set", async () => {
    const { isBoxNowApiConfigured } = await import("@/infrastructure/shipping/boxNowApiClient");
    expect(await isBoxNowApiConfigured()).toBe(false);
  });

  it("returns true once every required env var is set", async () => {
    stubRequiredEnv();
    const { isBoxNowApiConfigured } = await import("@/infrastructure/shipping/boxNowApiClient");
    expect(await isBoxNowApiConfigured()).toBe(true);
  });
});

describe("createBoxNowDeliveryRequest", () => {
  it("obtains an OAuth token, then creates a delivery request with the mapped payload", async () => {
    stubRequiredEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "token-abc", token_type: "Bearer", expires_in: 3600 }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ referenceNumber: "REF-1", parcels: [{ id: "PARCEL-1" }] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { createBoxNowDeliveryRequest } = await import("@/infrastructure/shipping/boxNowApiClient");
    const result = await createBoxNowDeliveryRequest({
      orderNumber: "order-1",
      invoiceValueEur: 25.5,
      paymentMode: "cod",
      amountToBeCollectedEur: 25.5,
      destinationLockerId: "LOCKER-42",
      customerName: "Иван Иванов",
      customerPhone: "0888123456",
      customerEmail: "ivan@example.bg",
    });

    expect(result).toEqual({ referenceNumber: "REF-1", parcelIds: ["PARCEL-1"] });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [authUrl, authInit] = fetchMock.mock.calls[0];
    expect(authUrl).toBe("https://partner-api.boxnow.bg/api/v1/auth-sessions");
    expect(JSON.parse(authInit.body)).toEqual({
      grant_type: "client_credentials",
      client_id: "test-client-id",
      client_secret: "test-client-secret",
    });

    const [deliveryUrl, deliveryInit] = fetchMock.mock.calls[1];
    expect(deliveryUrl).toBe("https://partner-api.boxnow.bg/api/v1/delivery-requests");
    expect(deliveryInit.headers.Authorization).toBe("Bearer token-abc");
    const deliveryBody = JSON.parse(deliveryInit.body);
    expect(deliveryBody.destination.locationId).toBe("LOCKER-42");
    expect(deliveryBody.paymentMode).toBe("cod");
    expect(deliveryBody.amountToBeCollected).toBe("25.50");
    expect(deliveryBody.origin.locationId).toBe("origin-location-1");
  });

  it("throws ShippingProviderError when the API call fails", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValue(new Response("auth failed", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const { createBoxNowDeliveryRequest } = await import("@/infrastructure/shipping/boxNowApiClient");
    await expect(
      createBoxNowDeliveryRequest({
        orderNumber: "order-1",
        invoiceValueEur: 25.5,
        paymentMode: "prepaid",
        amountToBeCollectedEur: 0,
        destinationLockerId: "LOCKER-42",
        customerName: "Иван Иванов",
        customerPhone: "0888123456",
      }),
    ).rejects.toThrow(/BOX NOW auth-sessions failed/);
  });

  it("throws ShippingProviderError when credentials are not configured", async () => {
    const { createBoxNowDeliveryRequest } = await import("@/infrastructure/shipping/boxNowApiClient");
    await expect(
      createBoxNowDeliveryRequest({
        orderNumber: "order-1",
        invoiceValueEur: 25.5,
        paymentMode: "prepaid",
        amountToBeCollectedEur: 0,
        destinationLockerId: "LOCKER-42",
        customerName: "Иван Иванов",
        customerPhone: "0888123456",
      }),
    ).rejects.toThrow(/not configured/);
  });
});
