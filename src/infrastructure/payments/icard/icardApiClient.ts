import { PaymentProviderError } from "@/domain/payment/types";
import { phpUrlEncode, signIcardFields, verifyIcardFields } from "@/infrastructure/payments/icard/icardSignature";
import { getICardSettings, isICardConfigured } from "@/infrastructure/settings/icardSettingsService";

/**
 * Low-level client for iCard's IPG API, per the official "IPG API v3.4"
 * manual (RSA-signed POST requests, XML responses). All values below are
 * account-specific and issued/exchanged by iCard only after integration —
 * never hardcoded. Read from the admin-editable settings (see
 * `icardSettingsService.ts`), which itself falls back to env vars for local
 * use without a database.
 */

interface ICardApiConfig {
  apiUrl: string;
  originator: string;
  mid: string;
  midName: string;
  keyIndex: string;
  ipgVersion: string;
  language: string;
  privateKey: string;
  icardPublicKey: string;
}

async function readConfig(): Promise<ICardApiConfig | null> {
  if (!(await isICardConfigured())) return null;
  return getICardSettings();
}

export async function isICardApiConfigured(): Promise<boolean> {
  return isICardConfigured();
}

export async function getICardPublicKey(): Promise<string | null> {
  const config = await readConfig();
  return config?.icardPublicKey ?? null;
}

/** ISO 4217 numeric currency code for EUR. */
const EUR_NUMERIC_CURRENCY_CODE = "978";
/** ISO 3166-1 numeric country code for Bulgaria — the site is BG-only. */
const BULGARIA_NUMERIC_COUNTRY_CODE = "100";

export interface PaymentWidgetTokenInput {
  orderId: string;
  amountEur: number;
  customerIp: string;
  customerName: string;
  customerEmail: string;
  billingCity: string;
  billingPostCode: string;
  billingAddressLine1: string;
  urlNotify: string;
  note?: string;
}

export interface PaymentWidgetTokenResult {
  token: string;
}

function extractXmlTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match?.[1]?.trim();
}

/**
 * Requests a payment widget token (`API Call: IPGPaymentToken`), the
 * back-end step that precedes rendering iCard's embedded payment widget
 * (`<div id="ipg">` + `payment-widget.js?token=...`) client-side. See the
 * "IPG Payment Widget" section of the manual.
 */
export async function requestPaymentWidgetToken(
  input: PaymentWidgetTokenInput,
): Promise<PaymentWidgetTokenResult> {
  const config = await readConfig();
  if (!config) {
    throw new PaymentProviderError("iCard IPG API credentials are not configured.");
  }

  const amount = input.amountEur.toFixed(2);

  // Field order matters: it's exactly what gets concatenated for the
  // request signature, and must match the order values are sent in.
  const fields: [string, string][] = [
    ["IPGmethod", "IPGPaymentToken"],
    ["KeyIndex", config.keyIndex],
    ["IPGVersion", config.ipgVersion],
    ["Language", config.language],
    ["Originator", config.originator],
    ["WidgetType", "IPGPurchase"],
    ["MID", config.mid],
    ["MIDName", config.midName],
    ["Amount", amount],
    ["Currency", EUR_NUMERIC_CURRENCY_CODE],
    ["CustomerIP", input.customerIp],
    ["OrderID", input.orderId],
    ["BannerIndex", "1"],
    ["URL_Notify", input.urlNotify],
    ["Note", input.note ?? ""],
    ["CardholderName", input.customerName],
    ["Email", input.customerEmail],
    ["BillAddrCountry", BULGARIA_NUMERIC_COUNTRY_CODE],
    ["BillAddrCity", input.billingCity],
    ["BillAddrPostCode", input.billingPostCode],
    ["BillAddrLine1", input.billingAddressLine1],
    ["CartItems", "1"],
    ["Article_1", "ЗАБАВЍ creative kit"],
    ["Quantity_1", "1"],
    ["Price_1", amount],
    ["Amount_1", amount],
    ["Currency_1", EUR_NUMERIC_CURRENCY_CODE],
  ];

  const signature = signIcardFields(fields, config.privateKey);
  const body = [...fields, ["Signature", signature]]
    .map(([key, value]) => `${key}=${phpUrlEncode(value)}`)
    .join("&");

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new PaymentProviderError(
      `iCard IPGPaymentToken failed with status ${response.status}: ${await response.text().catch(() => "")}`,
    );
  }

  const xml = await response.text();
  const status = extractXmlTag(xml, "status");
  const statusMsg = extractXmlTag(xml, "status_msg");
  const token = extractXmlTag(xml, "token");
  const responseSignature = extractXmlTag(xml, "Signature");

  if (status !== "0" || !token || !responseSignature) {
    throw new PaymentProviderError(`iCard IPGPaymentToken returned an error: ${statusMsg ?? "unknown error"}`);
  }

  // Best-effort response verification: the manual documents the general
  // signing mechanism for POST exchanges but doesn't show a worked example
  // for this specific XML response. We apply the same mechanism to the
  // response's own ordered elements (status, status_msg, token). If this
  // assumption is ever wrong, this fails closed (rejects) rather than
  // silently trusting an unverified token.
  const verified = verifyIcardFields(
    [
      ["status", status],
      ["status_msg", statusMsg ?? ""],
      ["token", token],
    ],
    responseSignature,
    config.icardPublicKey,
  );
  if (!verified) {
    throw new PaymentProviderError(
      "iCard IPGPaymentToken response signature did not verify — refusing to trust the returned token.",
    );
  }

  return { token };
}
