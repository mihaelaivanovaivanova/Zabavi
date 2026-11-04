import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signIcardFields } from "@/infrastructure/payments/icard/icardSignature";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
const OUR_PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs1", format: "pem" }).toString();
const ICARD_PUBLIC_KEY_PEM = publicKey.export({ type: "spki", format: "pem" }).toString();

const REQUIRED_ENV = {
  ICARD_ORIGINATOR: "33",
  ICARD_MID: "000000000000123",
  ICARD_MID_NAME: "ЗАБАВЍ",
  ICARD_PRIVATE_KEY: OUR_PRIVATE_KEY_PEM,
  ICARD_IPG_PUBLIC_KEY: ICARD_PUBLIC_KEY_PEM,
};

function stubRequiredEnv() {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(key, value);
  }
}

function buildSignedResponseXml(status: string, statusMsg: string, token: string) {
  const signature = signIcardFields(
    [
      ["status", status],
      ["status_msg", statusMsg],
      ["token", token],
    ],
    OUR_PRIVATE_KEY_PEM, // iCard would sign with ITS OWN private key; our test key pair stands in for both sides.
  );
  return `<ipg_responce><status>${status}</status><status_msg>${statusMsg}</status_msg><token>${token}</token><Signature>${signature}</Signature></ipg_responce>`;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("isICardApiConfigured", () => {
  it("returns false when no credentials are set", async () => {
    const { isICardApiConfigured } = await import("@/infrastructure/payments/icard/icardApiClient");
    expect(isICardApiConfigured()).toBe(false);
  });

  it("returns true once every required env var is set", async () => {
    stubRequiredEnv();
    const { isICardApiConfigured } = await import("@/infrastructure/payments/icard/icardApiClient");
    expect(isICardApiConfigured()).toBe(true);
  });
});

describe("requestPaymentWidgetToken", () => {
  it("signs the request and returns the token once the response signature verifies", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(buildSignedResponseXml("0", "Success", "token-abc"), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { requestPaymentWidgetToken } = await import("@/infrastructure/payments/icard/icardApiClient");
    const result = await requestPaymentWidgetToken({
      orderId: "order-1",
      amountBgn: 23.45,
      customerIp: "82.119.81.30",
      customerName: "Иван Иванов",
      customerEmail: "ivan@example.bg",
      billingCity: "София",
      billingPostCode: "1000",
      billingAddressLine1: "ул. Примерна 1",
      urlNotify: "https://zabavi.example/api/webhooks/icard",
    });

    expect(result).toEqual({ token: "token-abc" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://ipay.bg/paymentpage");
    expect(init.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(init.body).toContain("IPGmethod=IPGPaymentToken");
    expect(init.body).toContain("WidgetType=IPGPurchase");
    expect(init.body).toContain("MID=000000000000123");
    expect(init.body).toContain("OrderID=order-1");
    expect(init.body).toMatch(/Signature=/);
  });

  it("throws when the response signature does not verify", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        `<ipg_responce><status>0</status><status_msg>Success</status_msg><token>token-abc</token><Signature>bm90LXZhbGlk</Signature></ipg_responce>`,
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { requestPaymentWidgetToken } = await import("@/infrastructure/payments/icard/icardApiClient");
    await expect(
      requestPaymentWidgetToken({
        orderId: "order-1",
        amountBgn: 23.45,
        customerIp: "82.119.81.30",
        customerName: "Иван Иванов",
        customerEmail: "ivan@example.bg",
        billingCity: "София",
        billingPostCode: "1000",
        billingAddressLine1: "ул. Примерна 1",
        urlNotify: "https://zabavi.example/api/webhooks/icard",
      }),
    ).rejects.toThrow(/signature did not verify/);
  });

  it("throws when iCard returns a non-zero status", async () => {
    stubRequiredEnv();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(buildSignedResponseXml("5", "Invalid MID", ""), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { requestPaymentWidgetToken } = await import("@/infrastructure/payments/icard/icardApiClient");
    await expect(
      requestPaymentWidgetToken({
        orderId: "order-1",
        amountBgn: 23.45,
        customerIp: "82.119.81.30",
        customerName: "Иван Иванов",
        customerEmail: "ivan@example.bg",
        billingCity: "София",
        billingPostCode: "1000",
        billingAddressLine1: "ул. Примерна 1",
        urlNotify: "https://zabavi.example/api/webhooks/icard",
      }),
    ).rejects.toThrow(/Invalid MID/);
  });

  it("throws when credentials are not configured", async () => {
    const { requestPaymentWidgetToken } = await import("@/infrastructure/payments/icard/icardApiClient");
    await expect(
      requestPaymentWidgetToken({
        orderId: "order-1",
        amountBgn: 23.45,
        customerIp: "82.119.81.30",
        customerName: "Иван Иванов",
        customerEmail: "ivan@example.bg",
        billingCity: "София",
        billingPostCode: "1000",
        billingAddressLine1: "ул. Примерна 1",
        urlNotify: "https://zabavi.example/api/webhooks/icard",
      }),
    ).rejects.toThrow(/not configured/);
  });
});
