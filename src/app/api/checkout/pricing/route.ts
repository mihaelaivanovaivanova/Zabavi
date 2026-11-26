import { NextResponse, connection } from "next/server";
import { getShippingPrices } from "@/infrastructure/settings/shippingPricesService";
import { getCodFeeEur } from "@/infrastructure/settings/checkoutSettingsService";

/** Public, read-only: admin-set shipping prices + COD fee, for the checkout summary sidebar. */
export async function GET() {
  await connection();
  const [shippingPrices, codFeeEur] = await Promise.all([getShippingPrices(), getCodFeeEur()]);
  return NextResponse.json({ shippingPrices, codFeeEur });
}
