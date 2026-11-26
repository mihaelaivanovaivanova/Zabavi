import { NextResponse } from "next/server";
import { syncShipmentTracking } from "@/infrastructure/shipping/shipmentTrackingSyncService";

/** Gated by proxy.ts — only reachable with a valid admin session cookie. Manual "Sync now" trigger; also run periodically from `server.mjs`. */
export async function POST() {
  const result = await syncShipmentTracking();
  return NextResponse.json({ data: result });
}
