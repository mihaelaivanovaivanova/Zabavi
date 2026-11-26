import { ShippingProviderError, type ShipmentStatus } from "@/domain/shipping/types";
import { getBoxNowSettings, isBoxNowConfigured } from "@/infrastructure/settings/boxNowSettingsService";

/**
 * Low-level client for BOX NOW's Partner API, per the official "BOX NOW API
 * Integration — Partner API" manual (OAuth2 client-credentials grant +
 * `POST /api/v1/delivery-requests`). All values below are account-specific
 * and issued by BOX NOW only after partner registration
 * (integrationsupport@boxnow.bg) — never hardcoded. Read from the
 * admin-editable settings (see `boxNowSettingsService.ts`), which itself
 * falls back to env vars for local use without a database.
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

async function readConfig(): Promise<BoxNowApiConfig | null> {
  if (!(await isBoxNowConfigured())) return null;
  return getBoxNowSettings();
}

export async function isBoxNowApiConfigured(): Promise<boolean> {
  return isBoxNowConfigured();
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
  invoiceValueEur: number;
  paymentMode: "prepaid" | "cod";
  amountToBeCollectedEur: number;
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
  const config = await readConfig();
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
      invoiceValue: input.invoiceValueEur.toFixed(2),
      paymentMode: input.paymentMode,
      amountToBeCollected: input.amountToBeCollectedEur.toFixed(2),
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
      items: [{ id: input.orderNumber, name: "ЗАБАВЍ creative kit", value: input.invoiceValueEur.toFixed(2), weight: 1 }],
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

async function authHeaders(config: BoxNowApiConfig): Promise<Record<string, string>> {
  const accessToken = await getAccessToken(config);
  return {
    Authorization: `Bearer ${accessToken}`,
    ...(config.partnerId ? { "X-PartnerID": config.partnerId } : {}),
  };
}

/**
 * BOX NOW's own state vocabulary (Partner API manual §4.5), ported from
 * `BoxNowShippingProvider::mapStatus()`. "final-destination" means the
 * parcel reached its destination locker and is waiting for pickup — there's
 * no courier-to-door leg for a locker network, so it maps to
 * `ready_for_pickup`, not `out_for_delivery`.
 */
function mapBoxNowStatus(rawStatus: string): ShipmentStatus {
  switch (rawStatus) {
    case "new":
      return "accepted";
    case "in-transit":
    case "in-depot":
    case "wait-for-load":
      return "in_transit";
    case "final-destination":
      return "ready_for_pickup";
    case "delivered":
      return "delivered";
    case "returned":
    case "cancelled-return":
    case "expired-return":
      return "returned";
    case "cancelled":
    case "canceled":
    case "lost":
    case "missing":
      return "failed";
    default:
      return "pending";
  }
}

export interface BoxNowTrackingEvent {
  status: ShipmentStatus;
  description: string | null;
  occurredAt: string;
}

export interface BoxNowTrackingResult {
  currentStatus: ShipmentStatus;
  events: BoxNowTrackingEvent[];
}

/** `GET parcels?parcelId=...` — per the Partner API manual's parcel-lookup endpoint. */
export async function trackBoxNowParcel(trackingNumber: string): Promise<BoxNowTrackingResult> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("BOX NOW Partner API credentials are not configured.");
  }

  const headers = await authHeaders(config);
  const response = await fetch(`${config.apiUrl}/api/v1/parcels?parcelId=${encodeURIComponent(trackingNumber)}`, {
    headers,
  });

  if (!response.ok) {
    throw new ShippingProviderError(`BOX NOW parcels lookup failed with status ${response.status}`);
  }

  const body = (await response.json()) as {
    data?: { state?: string; events?: { type: string; locationDisplayName?: string; createTime: string }[] }[];
  };
  const parcel = body.data?.[0];
  if (!parcel) {
    throw new ShippingProviderError("BOX NOW parcel not found.");
  }

  const events: BoxNowTrackingEvent[] = (parcel.events ?? []).map((event) => ({
    status: mapBoxNowStatus(event.type),
    description: event.locationDisplayName ?? null,
    occurredAt: new Date(event.createTime).toISOString(),
  }));

  return { currentStatus: mapBoxNowStatus(parcel.state ?? "new"), events };
}

/** `GET parcels/{id}/label.pdf` — raw PDF body, per the Partner API manual. */
export async function fetchBoxNowLabel(trackingNumber: string): Promise<ArrayBuffer> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("BOX NOW Partner API credentials are not configured.");
  }

  const headers = await authHeaders(config);
  const response = await fetch(`${config.apiUrl}/api/v1/parcels/${encodeURIComponent(trackingNumber)}/label.pdf`, {
    headers,
  });

  if (!response.ok) {
    throw new ShippingProviderError(`BOX NOW label fetch failed with status ${response.status}`);
  }

  return response.arrayBuffer();
}

/** `POST parcels/{id}:cancel` — a colon-suffixed action endpoint, no request body; `reason` is accepted for API symmetry with Speedy but unused, since BOX NOW's cancel endpoint takes none. */
export async function cancelBoxNowParcel(trackingNumber: string, _reason?: string | null): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("BOX NOW Partner API credentials are not configured.");
  }

  const headers = await authHeaders(config);
  const response = await fetch(
    `${config.apiUrl}/api/v1/parcels/${encodeURIComponent(trackingNumber)}:cancel`,
    { method: "POST", headers },
  );

  if (!response.ok) {
    throw new ShippingProviderError(`BOX NOW cancel failed with status ${response.status}`);
  }
}
