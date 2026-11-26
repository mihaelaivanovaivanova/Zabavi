import { NextResponse, connection } from "next/server";
import { getBoxNowMarketingContent } from "@/infrastructure/content/boxNowMarketingService";

/** Public, read-only: admin-editable visibility/copy for the top banner + homepage BOX NOW badge. */
export async function GET() {
  await connection();
  const content = await getBoxNowMarketingContent();
  return NextResponse.json({ content });
}
