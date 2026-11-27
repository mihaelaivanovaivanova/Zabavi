import { ShippingProviderError, type ShipmentStatus } from "@/domain/shipping/types";
import { getSpeedySettings, isSpeedyConfigured } from "@/infrastructure/settings/speedySettingsService";

/**
 * Low-level client for Speedy's real Web API (`https://api.speedy.bg/v1`),
 * ported from the verified smisul.bg integration (see that project's
 * `SpeedyShippingProvider.php`, confirmed end-to-end against Speedy's
 * sandbox with live test credentials). Credentials travel as
 * `userName`/`password` fields in every request body, not an HTTP auth
 * header — per Speedy's documented schema, every endpoint below requires
 * them, including the client lookup.
 *
 * Speedy returns HTTP 200 even for a business-logic rejection (e.g. no
 * courier scheduled to collect from the sender address today) — the real
 * reason lives in the response body's `error` object, not the HTTP status
 * — so `postJson` below checks for that on every call, not just non-2xx.
 */

interface SpeedyConfig {
  apiUrl: string;
  username: string;
  password: string;
  dropoffOfficeId: string;
  serviceId: string;
}

async function readConfig(): Promise<SpeedyConfig | null> {
  if (!(await isSpeedyConfigured())) return null;
  const settings = await getSpeedySettings();
  return {
    apiUrl: settings.apiUrl,
    username: settings.username,
    password: settings.password,
    dropoffOfficeId: settings.dropoffOfficeId,
    serviceId: settings.serviceId || "505",
  };
}

export async function isSpeedyApiConfigured(): Promise<boolean> {
  return isSpeedyConfigured();
}

function withCredentials(config: SpeedyConfig, body: Record<string, unknown>): Record<string, unknown> {
  return {
    userName: config.username,
    password: config.password,
    // Bulgarian-language office names/addresses — this storefront has no
    // English UI to match an 'EN' response against.
    language: "BG",
    ...body,
  };
}

async function postJson(
  config: SpeedyConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${config.apiUrl.replace(/\/+$/, "")}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withCredentials(config, body)),
    // Every call here hits Speedy's live API with live data (shipments,
    // live office/locker lists, tracking) — never something Next.js's own
    // fetch cache should serve a stale copy of, in case that default ever
    // applies to a POST call the way it does to GET.
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const error = json?.error as { message?: string } | undefined;

  if (!response.ok || error) {
    const reason = error?.message ?? `HTTP ${response.status}`;
    throw new ShippingProviderError(`Speedy ${path} failed: ${reason}`);
  }

  return json ?? {};
}

/**
 * The account's own registered identity on file with Speedy — `clientId`
 * is required by `sender.dropoff` shipments so the printed label shows
 * that real sender identity, and so Speedy accepts this account as a
 * valid payer for the courier service; `clientName` is pulled alongside it
 * purely to override Speedy's registered `contactName` (often a person's
 * name — the account holder — rather than the business). Two real
 * endpoints per Speedy's schema: `POST client` for the id, then
 * `POST client/{id}` for the name. Cached per credentials set, since
 * neither changes for a given account and every shipment creation would
 * otherwise cost two extra round trips.
 */
interface OwnClient {
  clientId: number;
  clientName: string;
}

let ownClientCache: { key: string; value: OwnClient } | null = null;

async function getOwnClient(config: SpeedyConfig): Promise<OwnClient> {
  const cacheKey = `${config.apiUrl}:${config.username}`;
  if (ownClientCache && ownClientCache.key === cacheKey) {
    return ownClientCache.value;
  }

  const idResponse = await postJson(config, "client", {});
  const clientId = idResponse.clientId;
  if (clientId === null || clientId === undefined) {
    throw new ShippingProviderError("Speedy client lookup did not return a clientId.");
  }

  const detailResponse = await postJson(config, `client/${clientId}`, {});
  const client = detailResponse.client as { clientName?: string } | undefined;
  if (!client?.clientName) {
    throw new ShippingProviderError("Speedy client lookup did not return a clientName.");
  }

  const value: OwnClient = { clientId: Number(clientId), clientName: client.clientName };
  ownClientCache = { key: cacheKey, value };
  return value;
}

/**
 * Bulgarian free-text address line -> Speedy's real Address schema fields
 * (complexName/blockNo/entranceNo/floorNo/apartmentNo are real, separate
 * fields from streetName/streetNo). Ordered so complexName (whose value
 * can itself contain multiple words) is pulled out before the
 * single-token block/entrance/floor/apartment matches, which stops it from
 * swallowing a later token that happens to share the same clause.
 */
const ADDRESS_COMPONENT_PATTERNS: Record<string, RegExp> = {
  complexName: /ж\.?\s*к\.?\s*([^,]+)/iu,
  blockNo: /бл\.\s*([^\s,]+)/iu,
  entranceNo: /вх\.\s*([^\s,]+)/iu,
  floorNo: /ет\.\s*([^\s,]+)/iu,
  apartmentNo: /ап\.\s*([^\s,]+)/iu,
};

/** Speedy's real `shipment` endpoint rejects `address.streetName` past this length. */
const MAX_STREET_NAME_LENGTH = 50;

interface AddressComponents {
  streetName: string;
  streetNo: string;
  complexName: string | null;
  blockNo: string | null;
  entranceNo: string | null;
  floorNo: string | null;
  apartmentNo: string | null;
}

function parseAddressComponents(addressLine: string): AddressComponents {
  let remaining = addressLine.trim();
  const components: Record<string, string> = {};

  for (const [field, pattern] of Object.entries(ADDRESS_COMPONENT_PATTERNS)) {
    const match = remaining.match(pattern);
    if (match) {
      components[field] = match[1].trim();
      remaining = remaining
        .replace(pattern, "")
        .replace(/\s*,\s*,/, ",")
        .replace(/^[\s,]+|[\s,]+$/g, "")
        .trim();
    }
  }

  const [streetName, streetNo] = splitStreetAndNumber(remaining);

  return {
    streetName,
    streetNo,
    complexName: components.complexName ?? null,
    blockNo: components.blockNo ?? null,
    entranceNo: components.entranceNo ?? null,
    floorNo: components.floorNo ?? null,
    apartmentNo: components.apartmentNo ?? null,
  };
}

/**
 * Pulls a trailing house number (e.g. "1", "25А") off whatever free text is
 * left as streetNo; if none is found, the whole remainder becomes
 * streetName and streetNo falls back to "0" so the request stays
 * deliverable-shaped rather than failing outright — Speedy's real
 * `shipment` endpoint rejects an address without a non-empty streetNo.
 */
function splitStreetAndNumber(addressLine: string): [string, string] {
  const trimmed = addressLine.trim();
  const match = trimmed.match(/^(.*?)[\s,]+(\d+[A-Za-zА-Яа-я]?)$/u);
  if (match) {
    return [truncateStreetName(match[1].trim()), match[2]];
  }
  return [truncateStreetName(trimmed), "0"];
}

/**
 * A plain left-to-right cut would lose the actual street name and keep
 * only the least useful part (the city quarter). Comma-separated segments
 * are instead dropped from the front (broadest context first — city, then
 * residential complex) until what's left fits, since the *last* segment is
 * conventionally the actual deliverable street name a Bulgarian free-text
 * address ends with.
 */
function truncateStreetName(streetName: string): string {
  if (streetName.length <= MAX_STREET_NAME_LENGTH) return streetName;

  const segments = streetName
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment !== "");

  if (segments.length === 0) return streetName.slice(0, MAX_STREET_NAME_LENGTH);

  let kept = "";
  for (const segment of [...segments].reverse()) {
    const candidate = kept === "" ? segment : `${segment}, ${kept}`;
    if (candidate.length > MAX_STREET_NAME_LENGTH) break;
    kept = candidate;
  }

  return kept !== "" ? kept : segments[segments.length - 1].slice(0, MAX_STREET_NAME_LENGTH);
}

/**
 * Leaving `service.pickupDate` unset defaults it to "today" on Speedy's
 * side, which their real API rejects outright once the account's same-day
 * courier collection cutoff has passed. Always requesting the next working
 * day sidesteps that cutoff entirely rather than depending on what time of
 * day checkout happens to occur.
 */
function nextPickupDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type CreateSpeedyShipmentDestination =
  | { type: "address"; address: string; city: string; postalCode: string }
  | { type: "office"; officeId: string };

export interface CreateSpeedyShipmentInput {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  destination: CreateSpeedyShipmentDestination;
  paymentMethod: "prepaid" | "cod";
  /** Only meaningful when `paymentMethod` is "cod". */
  amountToCollectEur: number;
}

export interface CreateSpeedyShipmentResult {
  trackingNumber: string;
}

function addressFieldsFor(destination: Extract<CreateSpeedyShipmentDestination, { type: "address" }>) {
  const components = parseAddressComponents(destination.address);
  return {
    siteName: destination.city,
    postCode: destination.postalCode,
    streetName: components.streetName,
    streetNo: components.streetNo,
    ...(components.complexName ? { complexName: components.complexName } : {}),
    ...(components.blockNo ? { blockNo: components.blockNo } : {}),
    ...(components.entranceNo ? { entranceNo: components.entranceNo } : {}),
    ...(components.floorNo ? { floorNo: components.floorNo } : {}),
    ...(components.apartmentNo ? { apartmentNo: components.apartmentNo } : {}),
  };
}

export async function createSpeedyShipment(
  input: CreateSpeedyShipmentInput,
): Promise<CreateSpeedyShipmentResult> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("Speedy API credentials are not configured.");
  }

  const ownClient = await getOwnClient(config);

  const service: Record<string, unknown> = {
    serviceId: Number(config.serviceId),
    pickupDate: nextPickupDate(),
  };

  if (input.paymentMethod === "cod") {
    service.additionalServices = {
      cod: {
        amount: input.amountToCollectEur,
        currencyCode: "EUR",
        // Both cash and a card payment at the door are allowed
        // (cardPaymentForbidden defaults to false).
        processingType: "CASH",
        // The collected amount already includes the shipping charge —
        // Speedy shouldn't add its own delivery fee on top of it.
        includeShippingPrice: false,
        // Speedy issues the fiscal receipt ("касов бон") for any cash
        // collection on our behalf — vatGroup "А" is the Cyrillic letter,
        // not the visually identical Latin "A", which Speedy rejects.
        fiscalReceiptItems: [
          {
            description: `Поръчка ${input.orderNumber}`,
            vatGroup: "А",
            amount: input.amountToCollectEur,
            amountWithVat: input.amountToCollectEur,
          },
        ],
      },
      // OBPD ("Opening Before Paying/Delivery") lets the recipient open and
      // inspect the parcel before paying the courier — only meaningful
      // alongside COD, nothing to inspect "before paying" on a prepaid order.
      obpd: {
        option: "OPEN",
        returnShipmentPayer: "RECIPIENT",
      },
    };
  }

  // Office/APT and address recipients are mutually exclusive per Speedy's
  // real API — pickupOfficeId is the same field for both a staffed office
  // and an automated machine (see offices() in this file).
  const recipientDestination =
    input.destination.type === "office"
      ? { pickupOfficeId: Number(input.destination.officeId) }
      : { address: addressFieldsFor(input.destination) };

  const response = await postJson(config, "shipment", {
    sender: {
      dropoff: true,
      dropoffOfficeId: Number(config.dropoffOfficeId),
      clientId: ownClient.clientId,
      contactName: ownClient.clientName,
    },
    recipient: {
      clientName: input.customerName,
      privatePerson: true,
      phone1: { number: input.customerPhone },
      ...recipientDestination,
    },
    service,
    content: { parcelsCount: 1, totalWeight: 1.0, contents: "Merchandise", package: "BOX" },
    payment: { courierServicePayer: "SENDER" },
    ref1: input.orderNumber,
  });

  const parcels = response.parcels as { parcelId?: string }[] | undefined;
  const trackingNumber = response.id ?? parcels?.[0]?.parcelId;
  if (trackingNumber === null || trackingNumber === undefined) {
    throw new ShippingProviderError("Speedy shipment creation did not return a tracking number.");
  }

  return { trackingNumber: String(trackingNumber) };
}

export interface SpeedyTrackingEvent {
  status: ShipmentStatus;
  description: string | null;
  occurredAt: string;
}

/**
 * Maps Speedy's real Track And Trace operation codes (Appendix 1 of their
 * API docs) onto the shared `ShipmentStatus` vocabulary — ported from
 * `SpeedyShippingProvider::mapStatus()`. 38/111 ("Връщане...") only count
 * as a genuine `returned` when the description names the sender
 * (подател) — the same code also fires for a mid-journey office redirect
 * that isn't a return at all, confirmed live against smisul.bg's real
 * shipments; anything else under those codes falls through to `pending`.
 */
function mapSpeedyOperationCode(operationCode: number, description: string | null): ShipmentStatus {
  if (operationCode === 38 || operationCode === 111) {
    return description?.includes("подател") ? "returned" : "pending";
  }

  switch (operationCode) {
    case 39:
      return "picked_up";
    case 1:
    case 2:
    case 21:
      return "in_transit";
    case 11:
      return "prepared";
    case 12:
      return "out_for_delivery";
    case 1134:
      return "ready_for_pickup";
    case -14:
      return "delivered";
    case 44:
    case 123:
      return "failed";
    default:
      return "pending";
  }
}

const STICKY_SHIPMENT_STATUSES: ReadonlySet<ShipmentStatus> = new Set(["delivered", "returned", "failed", "cancelled"]);

/**
 * The most recent sticky status (delivered/returned/failed/cancelled) if
 * any operation reports one, regardless of what's reported chronologically
 * after it — otherwise simply the last operation. Requires `events` already
 * sorted by `occurredAt` — see `trackSpeedyShipment()`. Ports
 * `SpeedyShippingProvider::mostAdvancedStatus()`: Speedy logs a trailing
 * post-delivery operation for every COD shipment (OBPD's accept/decline
 * outcome) that this app doesn't recognize, which would otherwise hide the
 * real Delivered operation right before it.
 */
function mostAdvancedSpeedyStatus(events: SpeedyTrackingEvent[]): ShipmentStatus {
  if (events.length === 0) return "pending";
  for (let i = events.length - 1; i >= 0; i--) {
    if (STICKY_SHIPMENT_STATUSES.has(events[i].status)) return events[i].status;
  }
  return events[events.length - 1].status;
}

export interface SpeedyTrackingResult {
  currentStatus: ShipmentStatus;
  events: SpeedyTrackingEvent[];
}

/**
 * `POST track` — fetches full operation history (not `lastOperationOnly`),
 * sorted here by `dateTime`, never trusting Speedy's own array order —
 * confirmed live against smisul.bg that it isn't reliably chronological.
 */
export async function trackSpeedyShipment(trackingNumber: string): Promise<SpeedyTrackingResult> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("Speedy API credentials are not configured.");
  }

  const response = await postJson(config, "track", { parcels: [{ id: trackingNumber }] });
  const parcels = response.parcels as { operations?: Record<string, unknown>[] }[] | undefined;
  const operations = parcels?.[0]?.operations ?? [];

  const events: SpeedyTrackingEvent[] = operations
    .map((operation) => {
      const operationCode = Number(operation.operationCode);
      const description = typeof operation.description === "string" ? operation.description : null;
      return {
        status: mapSpeedyOperationCode(operationCode, description),
        description,
        occurredAt: new Date(String(operation.dateTime)).toISOString(),
      };
    })
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  return { currentStatus: mostAdvancedSpeedyStatus(events), events };
}

/**
 * `POST print` — a real A6 PDF label (raw body, not JSON), per Speedy's
 * schema (`parcels[].parcelId.id`, not a bare string).
 */
export async function fetchSpeedyLabel(trackingNumber: string): Promise<ArrayBuffer> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("Speedy API credentials are not configured.");
  }

  const response = await fetch(`${config.apiUrl.replace(/\/+$/, "")}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      withCredentials(config, { paperSize: "A6", parcels: [{ parcelId: { id: trackingNumber } }] }),
    ),
  });

  if (!response.ok) {
    throw new ShippingProviderError(`Speedy print failed: HTTP ${response.status}`);
  }

  return response.arrayBuffer();
}

/**
 * `POST shipment/cancel` — `comment` isn't truly optional despite the
 * schema marking it so: Speedy rejects anything under 4 characters, so a
 * blank/short admin-supplied reason is padded to a safe default instead.
 */
export async function cancelSpeedyShipment(trackingNumber: string, reason?: string | null): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("Speedy API credentials are not configured.");
  }

  const comment = (reason ?? "").trim().length >= 4 ? (reason ?? "").trim() : "Отказана от администратор";

  await postJson(config, "shipment/cancel", { shipmentId: trackingNumber, comment });
}

export interface SpeedyOffice {
  id: string;
  type: "office" | "locker";
  name: string;
  city: string;
  address: string;
}

/**
 * `POST location/office` — staffed offices and APT machines come back in
 * one flat list, distinguished only by the office's own `type` field
 * ("APT" → an automated machine, ported from smisul.bg's `offices()`).
 */
export async function searchSpeedyOffices(city?: string): Promise<SpeedyOffice[]> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("Speedy API credentials are not configured.");
  }

  const response = await postJson(config, "location/office", city ? { siteName: city } : {});
  const offices = response.offices as
    | { id: string | number; type?: string; name: string; address?: { siteName?: string; fullAddressString?: string } }[]
    | undefined;

  return (offices ?? []).map((office) => ({
    id: String(office.id),
    type: office.type === "APT" ? "locker" : "office",
    name: office.name,
    city: office.address?.siteName ?? city ?? "",
    address: office.address?.fullAddressString ?? "",
  }));
}

export interface SpeedySettlement {
  id: string;
  /** Speedy's own type prefix, e.g. "гр." or "с." — already display-ready. */
  type: string;
  name: string;
  municipality: string;
  region: string;
  postalCode: string;
}

/** A single CSV line → fields, handling quoted values (which may contain commas) — JS has no `str_getcsv` built in. */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseSpeedySettlementsCsv(body: string): SpeedySettlement[] {
  const lines = body.split(/\r\n|\r|\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = values[index] ?? "";
    });
    return {
      id: row.id ?? "",
      type: row.type ?? "",
      name: row.name ?? "",
      municipality: row.municipality ?? "",
      region: row.region ?? "",
      postalCode: row.postCode ?? "",
    };
  });
}

/**
 * `POST location/site/csv/100` — Bulgaria's full settlement nomenclature
 * (~5,300 towns/cities/villages), ported from smisul.bg's
 * `BulgarianSettlementService`. Returns raw CSV text, not JSON — the only
 * Speedy endpoint that does. Callers should cache this (see
 * `settlementsService.ts`): it's a ~700KB response and effectively static.
 */
export async function fetchSpeedySettlements(): Promise<SpeedySettlement[]> {
  const config = await readConfig();
  if (!config) {
    throw new ShippingProviderError("Speedy API credentials are not configured.");
  }

  const response = await fetch(`${config.apiUrl.replace(/\/+$/, "")}/location/site/csv/100`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withCredentials(config, {})),
  });

  if (!response.ok) {
    throw new ShippingProviderError(`Speedy location/site/csv failed: HTTP ${response.status}`);
  }

  const body = await response.text();
  return body ? parseSpeedySettlementsCsv(body) : [];
}
