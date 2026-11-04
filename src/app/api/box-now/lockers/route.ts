import { NextResponse } from "next/server";

/**
 * Public, credential-free BOX NOW locations feed (manual section 4.3.1,
 * "for better performance" alternative to the OAuth-gated /destinations
 * call). Proxied server-side to avoid CORS and to filter/shape the
 * response — the raw feed is ~900 entries with fields we don't need.
 */
const BOXNOW_LOCATIONS_URL = "https://locationapi-production.boxnow.bg/v1/apms_bg-BG.json";

interface BoxNowApmEntry {
  id: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  name: string;
  state: string;
}

export interface BoxNowLockerOption {
  id: string;
  city: string;
  addressLine1: string;
  postalCode: string;
  name: string;
}

export async function GET() {
  const response = await fetch(BOXNOW_LOCATIONS_URL, { next: { revalidate: 3600 } });
  if (!response.ok) {
    return NextResponse.json({ error: "Неуспешно зареждане на локациите на BOX NOW." }, { status: 502 });
  }

  const body = (await response.json()) as { data: BoxNowApmEntry[] };

  // "only-delivery" locations aren't confirmed ready for customer pickup
  // selection — only offer locations BOX NOW marks fully ready.
  const lockers: BoxNowLockerOption[] = body.data
    .filter((entry) => entry.state === "boxnow-ready")
    .map((entry) => ({
      id: entry.id,
      city: entry.addressLine2,
      addressLine1: entry.addressLine1,
      postalCode: entry.postalCode,
      name: entry.name,
    }));

  return NextResponse.json({ lockers });
}
