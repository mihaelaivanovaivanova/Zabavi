import { NextResponse, connection } from "next/server";
import { getObjectionsContent } from "@/infrastructure/content/objectionsService";

/** Public, read-only: admin-editable items for the landing page's "Ами ако…" section. */
export async function GET() {
  await connection();
  const content = await getObjectionsContent();
  return NextResponse.json({ content });
}
