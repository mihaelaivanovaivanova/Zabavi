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
    // BOX NOW's Partner API guide requires allowReturn to always be false
    // ("Винаги трябва да бъде false"), and compartmentSize is required on
    // every item whenever the origin is any-apm (this store's only origin).
    expect(deliveryBody.allowReturn).toBe(false);
    expect(deliveryBody.items[0].compartmentSize).toBe(2);
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

  it("wraps a request that never gets a response as a clear ShippingProviderError instead of letting it hang indefinitely", async () => {
    stubRequiredEnv();
    const timeoutError = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

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
    ).rejects.toThrow(/no response from BOX NOW/);
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

function mockAuthResponse() {
  return new Response(JSON.stringify({ access_token: "token-abc", token_type: "Bearer", expires_in: 3600 }), {
    status: 200,
  });
}

describe("trackBoxNowParcel", () => {
  it("maps BOX NOW's raw state vocabulary onto ShipmentStatus", async () => {
    stubRequiredEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockAuthResponse())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                state: "final-destination",
                events: [
                  { type: "new", createTime: "2026-01-01T10:00:00Z" },
                  { type: "final-destination", locationDisplayName: "Sofia", createTime: "2026-01-02T10:00:00Z" },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { trackBoxNowParcel } = await import("@/infrastructure/shipping/boxNowApiClient");
    const result = await trackBoxNowParcel("PARCEL-1");

    expect(result.currentStatus).toBe("ready_for_pickup");
    expect(result.events.map((e) => e.status)).toEqual(["accepted", "ready_for_pickup"]);

    const [url] = fetchMock.mock.calls[1];
    expect(url).toBe("https://partner-api.boxnow.bg/api/v1/parcels?parcelId=PARCEL-1");
  });

  it("throws when the parcel isn't found", async () => {
    stubRequiredEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockAuthResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { trackBoxNowParcel } = await import("@/infrastructure/shipping/boxNowApiClient");
    await expect(trackBoxNowParcel("PARCEL-1")).rejects.toThrow(/not found/);
  });
});

describe("fetchBoxNowLabel", () => {
  it("returns the raw PDF body from the label endpoint", async () => {
    stubRequiredEnv();
    const pdfBytes = new TextEncoder().encode("%PDF-1.4 fake label");
    const fetchMock = vi.fn().mockResolvedValueOnce(mockAuthResponse()).mockResolvedValueOnce(new Response(pdfBytes, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchBoxNowLabel } = await import("@/infrastructure/shipping/boxNowApiClient");
    const result = await fetchBoxNowLabel("PARCEL-1");

    expect(Array.from(new Uint8Array(result))).toEqual(Array.from(pdfBytes));
    const [url] = fetchMock.mock.calls[1];
    expect(url).toBe("https://partner-api.boxnow.bg/api/v1/parcels/PARCEL-1/label.pdf");
  });
});

describe("cancelBoxNowParcel", () => {
  it("posts to the colon-suffixed cancel action with no body", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(mockAuthResponse()).mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { cancelBoxNowParcel } = await import("@/infrastructure/shipping/boxNowApiClient");
    await cancelBoxNowParcel("PARCEL-1");

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://partner-api.boxnow.bg/api/v1/parcels/PARCEL-1:cancel");
    expect(init.method).toBe("POST");
  });

  it("throws ShippingProviderError when the cancel call fails", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(mockAuthResponse()).mockResolvedValueOnce(new Response(null, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const { cancelBoxNowParcel } = await import("@/infrastructure/shipping/boxNowApiClient");
    await expect(cancelBoxNowParcel("PARCEL-1")).rejects.toThrow(/403/);
  });
});
