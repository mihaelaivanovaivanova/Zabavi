import { NextResponse } from "next/server";
import { syncShipmentTracking } from "@/infrastructure/shipping/shipmentTrackingSyncService";

/**
 * Internal trigger for the periodic shipment-tracking sync — called by
 * `server.mjs`'s own interval, not by a browser (so it's gated by a shared
 * secret header, not the admin-session cookie `proxy.ts` uses everywhere
 * else). Same "leave unset to disable rather than accept unauthenticated
 * requests" shape as `BOXNOW_WEBHOOK_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.INTERNAL_SYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncShipmentTracking();
  return NextResponse.json({ data: result });
}
