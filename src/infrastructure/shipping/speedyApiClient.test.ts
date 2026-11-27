import { afterEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV = {
  SPEEDY_ENABLED: "true",
  SPEEDY_API_URL: "https://api.speedy.bg/v1",
  SPEEDY_USERNAME: "zabavi-test",
  SPEEDY_PASSWORD: "test-password",
  SPEEDY_DROPOFF_OFFICE_ID: "123",
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

describe("isSpeedyApiConfigured", () => {
  it("returns false when no credentials are set", async () => {
    const { isSpeedyApiConfigured } = await import("@/infrastructure/shipping/speedyApiClient");
    expect(await isSpeedyApiConfigured()).toBe(false);
  });

  it("returns true once every required env var is set", async () => {
    stubRequiredEnv();
    const { isSpeedyApiConfigured } = await import("@/infrastructure/shipping/speedyApiClient");
    expect(await isSpeedyApiConfigured()).toBe(true);
  });

  it("stays false when SPEEDY_ENABLED isn't 'true', even with every other var set", async () => {
    stubRequiredEnv();
    vi.stubEnv("SPEEDY_ENABLED", "false");
    const { isSpeedyApiConfigured } = await import("@/infrastructure/shipping/speedyApiClient");
    expect(await isSpeedyApiConfigured()).toBe(false);
  });
});

describe("createSpeedyShipment", () => {
  function mockClientLookup() {
    return [
      new Response(JSON.stringify({ clientId: 777 }), { status: 200 }),
      new Response(JSON.stringify({ client: { clientName: "ЗАБАВЍ ЕООД" } }), { status: 200 }),
    ] as const;
  }

  it("looks up the own client, splits the address, and creates a cash-on-delivery shipment", async () => {
    stubRequiredEnv();
    const [clientResponse, clientDetailResponse] = mockClientLookup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(clientResponse)
      .mockResolvedValueOnce(clientDetailResponse)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "63764622138", parcels: [{ parcelId: "63764622138" }] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { createSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    const result = await createSpeedyShipment({
      orderNumber: "order-1",
      customerName: "Иван Иванов",
      customerPhone: "0888123456",
      destination: { type: "address", address: "ул. Примерна 15, бл. 2, вх. А, ет. 3, ап. 7", city: "София", postalCode: "1000" },
      paymentMethod: "cod",
      amountToCollectEur: 25.5,
    });

    expect(result).toEqual({ trackingNumber: "63764622138" });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [clientUrl, clientInit] = fetchMock.mock.calls[0];
    expect(clientUrl).toBe("https://api.speedy.bg/v1/client");
    expect(JSON.parse(clientInit.body)).toMatchObject({
      userName: "zabavi-test",
      password: "test-password",
      language: "BG",
    });

    const [detailUrl] = fetchMock.mock.calls[1];
    expect(detailUrl).toBe("https://api.speedy.bg/v1/client/777");

    const [shipmentUrl, shipmentInit] = fetchMock.mock.calls[2];
    expect(shipmentUrl).toBe("https://api.speedy.bg/v1/shipment");
    const body = JSON.parse(shipmentInit.body);
    expect(body.sender).toMatchObject({
      dropoff: true,
      dropoffOfficeId: 123,
      clientId: 777,
      contactName: "ЗАБАВЍ ЕООД",
    });
    expect(body.recipient.address).toMatchObject({
      siteName: "София",
      postCode: "1000",
      streetName: "ул. Примерна",
      streetNo: "15",
      blockNo: "2",
      entranceNo: "А",
      floorNo: "3",
      apartmentNo: "7",
    });
    expect(body.service.serviceId).toBe(505);
    expect(body.service.additionalServices.cod).toMatchObject({
      amount: 25.5,
      currencyCode: "EUR",
      processingType: "CASH",
    });
    expect(body.service.additionalServices.obpd).toEqual({ option: "OPEN", returnShipmentPayer: "RECIPIENT" });
    expect(body.ref1).toBe("order-1");
  });

  it("creates a prepaid shipment without COD/OBPD, and only fetches the own client once across two calls", async () => {
    stubRequiredEnv();
    const [clientResponse, clientDetailResponse] = mockClientLookup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(clientResponse)
      .mockResolvedValueOnce(clientDetailResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "2" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { createSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    await createSpeedyShipment({
      orderNumber: "order-2",
      customerName: "Мария Петрова",
      customerPhone: "0888000000",
      destination: { type: "address", address: "бул. Васил Левски 10", city: "Пловдив", postalCode: "4000" },
      paymentMethod: "prepaid",
      amountToCollectEur: 0,
    });

    const firstBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(firstBody.service.additionalServices).toBeUndefined();
    expect(firstBody.recipient.address).toMatchObject({ streetName: "бул. Васил Левски", streetNo: "10" });

    await createSpeedyShipment({
      orderNumber: "order-3",
      customerName: "Георги Георгиев",
      customerPhone: "0888111111",
      destination: { type: "address", address: "ул. Тест 1", city: "Варна", postalCode: "9000" },
      paymentMethod: "prepaid",
      amountToCollectEur: 0,
    });

    // Only 4 calls total (2 client lookup + 2 shipment) — the second
    // createSpeedyShipment reused the cached own-client, not refetching it.
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("sends pickupOfficeId instead of a free-text address for an office/locker destination", async () => {
    stubRequiredEnv();
    const [clientResponse, clientDetailResponse] = mockClientLookup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(clientResponse)
      .mockResolvedValueOnce(clientDetailResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { createSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    await createSpeedyShipment({
      orderNumber: "order-5",
      customerName: "Иван Иванов",
      customerPhone: "0888123456",
      destination: { type: "office", officeId: "4567" },
      paymentMethod: "prepaid",
      amountToCollectEur: 0,
    });

    const body = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(body.recipient.pickupOfficeId).toBe(4567);
    expect(body.recipient.address).toBeUndefined();
  });

  it("throws ShippingProviderError when Speedy returns a business-logic error with HTTP 200", async () => {
    stubRequiredEnv();
    const [clientResponse, clientDetailResponse] = mockClientLookup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(clientResponse)
      .mockResolvedValueOnce(clientDetailResponse)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "courier-not-working-office-collection-possible" } }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { createSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    await expect(
      createSpeedyShipment({
        orderNumber: "order-4",
        customerName: "Иван Иванов",
        customerPhone: "0888123456",
        destination: { type: "address", address: "ул. Тест 1", city: "София", postalCode: "1000" },
        paymentMethod: "prepaid",
        amountToCollectEur: 0,
      }),
    ).rejects.toThrow(/courier-not-working/);
  });

  it("throws ShippingProviderError when credentials are not configured", async () => {
    const { createSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    await expect(
      createSpeedyShipment({
        orderNumber: "order-1",
        customerName: "Иван Иванов",
        customerPhone: "0888123456",
        destination: { type: "address", address: "ул. Тест 1", city: "София", postalCode: "1000" },
        paymentMethod: "prepaid",
        amountToCollectEur: 0,
      }),
    ).rejects.toThrow(/not configured/);
  });

  it("wraps a request that never gets a response (e.g. the connection just hangs) as a clear ShippingProviderError instead of letting it hang indefinitely", async () => {
    stubRequiredEnv();
    const timeoutError = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    const { createSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    await expect(
      createSpeedyShipment({
        orderNumber: "order-1",
        customerName: "Иван Иванов",
        customerPhone: "0888123456",
        destination: { type: "address", address: "ул. Тест 1", city: "София", postalCode: "1000" },
        paymentMethod: "prepaid",
        amountToCollectEur: 0,
      }),
    ).rejects.toThrow(/no response from Speedy/);
  });
});

describe("trackSpeedyShipment", () => {
  it("maps operation codes onto ShipmentStatus and sorts by timestamp, not API order", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          parcels: [
            {
              operations: [
                { operationCode: -14, dateTime: "2026-01-02T10:00:00+0200", description: "Доставена" },
                { operationCode: 1, dateTime: "2026-01-01T10:00:00+0200", description: "В транзит" },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { trackSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    const result = await trackSpeedyShipment("TRACK-1");

    expect(result.events.map((e) => e.status)).toEqual(["in_transit", "delivered"]);
    expect(result.currentStatus).toBe("delivered");
  });

  it("only counts a 38/111 operation as returned when the description names the sender", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          parcels: [{ operations: [{ operationCode: 38, dateTime: "2026-01-01T10:00:00+0200", description: "Връщане в офис" }] }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { trackSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    const result = await trackSpeedyShipment("TRACK-1");
    expect(result.currentStatus).toBe("pending");
  });

  it("keeps a sticky Delivered status even if a trailing unmapped operation follows it", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          parcels: [
            {
              operations: [
                { operationCode: -14, dateTime: "2026-01-01T10:00:00+0200", description: "Доставена" },
                { operationCode: 9999, dateTime: "2026-01-02T10:00:00+0200", description: "Непознато" },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { trackSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    const result = await trackSpeedyShipment("TRACK-1");
    expect(result.currentStatus).toBe("delivered");
  });
});

describe("fetchSpeedyLabel", () => {
  it("returns the raw PDF body from the print endpoint", async () => {
    stubRequiredEnv();
    const pdfBytes = new TextEncoder().encode("%PDF-1.4 fake label");
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(pdfBytes, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchSpeedyLabel } = await import("@/infrastructure/shipping/speedyApiClient");
    const result = await fetchSpeedyLabel("TRACK-1");

    expect(Array.from(new Uint8Array(result))).toEqual(Array.from(pdfBytes));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.speedy.bg/v1/print");
    expect(JSON.parse(init.body).parcels).toEqual([{ parcelId: { id: "TRACK-1" } }]);
  });
});

describe("cancelSpeedyShipment", () => {
  it("sends the tracking number and comment, padding a too-short reason", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { cancelSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    await cancelSpeedyShipment("TRACK-1", "no");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.speedy.bg/v1/shipment/cancel");
    const body = JSON.parse(init.body);
    expect(body.shipmentId).toBe("TRACK-1");
    expect(body.comment.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps a real admin-supplied reason as-is", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { cancelSpeedyShipment } = await import("@/infrastructure/shipping/speedyApiClient");
    await cancelSpeedyShipment("TRACK-1", "Грешен адрес на получателя");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.comment).toBe("Грешен адрес на получателя");
  });
});

describe("searchSpeedyOffices", () => {
  it("maps APT entries to locker and everything else to office", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          offices: [
            { id: 1, type: "OFFICE", name: "СОФИЯ ЦЕНТЪР", address: { siteName: "София", fullAddressString: "ул. Тест 1" } },
            { id: 2, type: "APT", name: "СОФИЯ АВТОМАТ", address: { siteName: "София", fullAddressString: "ул. Тест 2" } },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { searchSpeedyOffices } = await import("@/infrastructure/shipping/speedyApiClient");
    const offices = await searchSpeedyOffices("София");

    expect(offices).toEqual([
      { id: "1", type: "office", name: "СОФИЯ ЦЕНТЪР", city: "София", address: "ул. Тест 1" },
      { id: "2", type: "locker", name: "СОФИЯ АВТОМАТ", city: "София", address: "ул. Тест 2" },
    ]);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({ siteName: "София" });
  });

  it("searches without a city filter when none is given", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ offices: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { searchSpeedyOffices } = await import("@/infrastructure/shipping/speedyApiClient");
    await searchSpeedyOffices();

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).siteName).toBeUndefined();
  });
});

describe("fetchSpeedySettlements", () => {
  it("parses the CSV response, handling quoted fields", async () => {
    stubRequiredEnv();
    const csv = 'id,type,name,municipality,region,postCode\n1,"гр.","София","Столична","София-град",1000\n2,с.,Бистрица,Столична,София-град,1618';
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(csv, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchSpeedySettlements } = await import("@/infrastructure/shipping/speedyApiClient");
    const settlements = await fetchSpeedySettlements();

    expect(settlements).toEqual([
      { id: "1", type: "гр.", name: "София", municipality: "Столична", region: "София-град", postalCode: "1000" },
      { id: "2", type: "с.", name: "Бистрица", municipality: "Столична", region: "София-град", postalCode: "1618" },
    ]);
  });

  it("returns an empty list for an empty response body", async () => {
    stubRequiredEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("", { status: 200 })));

    const { fetchSpeedySettlements } = await import("@/infrastructure/shipping/speedyApiClient");
    expect(await fetchSpeedySettlements()).toEqual([]);
  });
});
