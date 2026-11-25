import { NextResponse, connection } from "next/server";
import { getFaqContent } from "@/infrastructure/content/faqService";

/** Public, read-only: admin-editable items for the landing page's FAQ section. */
export async function GET() {
  await connection();
  const content = await getFaqContent();
  return NextResponse.json({ content });
}
