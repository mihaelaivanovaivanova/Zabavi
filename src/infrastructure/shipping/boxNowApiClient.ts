import { ShippingProviderError } from "@/domain/shipping/types";

/**
 * Low-level client for BOX NOW's Partner API, per the official "BOX NOW API
 * Integration — Partner API" manual (OAuth2 client-credentials grant +
 * `POST /api/v1/delivery-requests`). All values below are account-specific
 * and issued by BOX NOW only after partner registration
 * (integrationsupport@boxnow.bg) — never hardcoded, always read from env.
 */

interface BoxNowApiConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  originLocationId: string;
  originContactName: string;
  originContactEmail: string;
  originContactNumber: string;
  partnerId?: string;
}

function readConfig(): BoxNowApiConfig | null {
  const apiUrl = process.env.BOXNOW_API_URL;
  const clientId = process.env.BOXNOW_OAUTH_CLIENT_ID;
  const clientSecret = process.env.BOXNOW_OAUTH_CLIENT_SECRET;
  const originLocationId = process.env.BOXNOW_ORIGIN_LOCATION_ID;
  const originContactName = process.env.BOXNOW_ORIGIN_CONTACT_NAME;
  const originContactEmail = process.env.BOXNOW_ORIGIN_CONTACT_EMAIL;
  const originContactNumber = process.env.BOXNOW_ORIGIN_CONTACT_NUMBER;

  if (
    !apiUrl ||
    !clientId ||
    !clientSecret ||
    !originLocationId ||
    !originContactName ||
    !originContactEmail ||
    !originContactNumber
  ) {
    return null;
  }

  return {
    apiUrl,
    clientId,
    clientSecret,
    originLocationId,
    originContactName,
    originContactEmail,
    originContactNumber,
    partnerId: process.env.BOXNOW_PARTNER_ID,
  };
}

export function isBoxNowApiConfigured(): boolean {
  return readConfig() !== null;
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;

/** 30s safety margin so a token never expires mid-request. */
const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 30_000;

async function getAccessToken(config: BoxNowApiConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAtMs > Date.now()) {
    return cachedToken.accessToken;
  }

  const response = await fetch(`${config.apiUrl}/api/v1/auth-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new ShippingProviderError(
      `BOX NOW auth-sessions failed with status ${response.status}: ${await response.text().catch(() => "")}`,
    );
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: body.access_token,
    expiresAtMs: Date.now() + body.expires_in * 1000 - TOKEN_EXPIRY_SAFETY_MARGIN_MS,
  };
  return cachedToken.accessToken;
}

export interface DeliveryRequestInput {
  orderNumber: string;
  invoiceValueBgn: number;
  paymentMode: "prepaid" | "cod";
  amountToBeCollectedBgn: number;
  destinationLockerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

export interface DeliveryRequestResult {
  referenceNumber: string;
  parcelIds: string[];
}

export async function createBoxNowDeliveryRequest(
  input: DeliveryRequestInput,
): Promise<DeliveryRequestResult> {
  const config = readConfig();
  if (!config) {
    throw new ShippingProviderError("BOX NOW Partner API credentials are not configured.");
  }

  const accessToken = await getAccessToken(config);

  const response = await fetch(`${config.apiUrl}/api/v1/delivery-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(config.partnerId ? { "X-PartnerID": config.partnerId } : {}),
    },
    body: JSON.stringify({
      orderNumber: input.orderNumber,
      invoiceValue: input.invoiceValueBgn.toFixed(2),
      paymentMode: input.paymentMode,
      amountToBeCollected: input.amountToBeCollectedBgn.toFixed(2),
      allowReturn: true,
      origin: {
        locationId: config.originLocationId,
        contactName: config.originContactName,
        contactEmail: config.originContactEmail,
        contactNumber: config.originContactNumber,
      },
      destination: {
        locationId: input.destinationLockerId,
        contactName: input.customerName,
        contactEmail: input.customerEmail,
        contactNumber: input.customerPhone,
      },
      items: [{ id: input.orderNumber, name: "ЗАБАВЍ creative kit", value: input.invoiceValueBgn.toFixed(2), weight: 1 }],
    }),
  });

  if (!response.ok) {
    throw new ShippingProviderError(
      `BOX NOW delivery-requests failed with status ${response.status}: ${await response.text().catch(() => "")}`,
    );
  }

  const body = (await response.json()) as { referenceNumber: string; parcels: { id: string }[] };
  return { referenceNumber: body.referenceNumber, parcelIds: body.parcels.map((p) => p.id) };
}
