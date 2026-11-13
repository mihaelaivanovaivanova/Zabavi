import { NextResponse, connection } from "next/server";
import { product } from "@/config/site";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";

/** Public, read-only: price/photos per kit, for the landing page and checkout summary. */
export async function GET() {
  await connection();
  const variantIds = product.variants.map((variant) => variant.id);
  const kits = await kitRepository.getMany(variantIds);
  return NextResponse.json({ kits });
}
