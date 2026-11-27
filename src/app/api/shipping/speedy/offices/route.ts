import { NextResponse, connection } from "next/server";
import { getAllSpeedyOffices } from "@/infrastructure/shipping/speedyOfficesService";

/**
 * Public, read-only: every Speedy office and automated machine (APT) in
 * Bulgaria, in one flat list — backs the checkout's "Speedy"/"Speedy
 * (автомат)" pickup-point pickers (the "Град" field there only lists
 * cities that actually have one, same as smisul.bg's own `OfficePicker`).
 * Cached server-side (see speedyOfficesService.ts); filtering by type/city
 * happens client-side, same as /api/box-now/lockers for BOX NOW.
 */
export async function GET() {
  await connection();
  const offices = await getAllSpeedyOffices();
  return NextResponse.json({ offices });
}
