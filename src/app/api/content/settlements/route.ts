import { NextResponse, connection } from "next/server";
import { getSettlements } from "@/infrastructure/content/settlementsService";

/** Public, read-only: the full Bulgarian settlement list for the checkout's "Населено място" picker. Cached server-side (see settlementsService.ts). */
export async function GET() {
  await connection();
  const settlements = await getSettlements();
  return NextResponse.json({ settlements });
}
