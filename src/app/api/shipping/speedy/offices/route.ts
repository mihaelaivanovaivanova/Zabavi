import { NextResponse } from "next/server";
import { searchSpeedyOffices } from "@/infrastructure/shipping/speedyApiClient";
import { ShippingProviderError } from "@/domain/shipping/types";

/**
 * Public: real Speedy offices/automated machines, optionally filtered by
 * city — backs the checkout's "Speedy"/"Speedy (автомат)" pickup-point
 * pickers, same role as `/api/box-now/lockers` for BOX NOW.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? undefined;
  const type = searchParams.get("type");

  try {
    const offices = await searchSpeedyOffices(city);
    const filtered = type === "office" || type === "locker" ? offices.filter((office) => office.type === type) : offices;
    return NextResponse.json({ offices: filtered });
  } catch (error) {
    if (error instanceof ShippingProviderError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
