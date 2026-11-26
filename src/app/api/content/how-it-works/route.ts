import { NextResponse, connection } from "next/server";
import { getHowItWorksContent } from "@/infrastructure/content/howItWorksService";

/** Public, read-only: admin-editable copy for the landing page's "Как протича рисуването" section. */
export async function GET() {
  await connection();
  const content = await getHowItWorksContent();
  return NextResponse.json({ content });
}
