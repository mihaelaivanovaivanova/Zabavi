import { NextResponse, connection } from "next/server";
import { getIllustrationsSectionContent } from "@/infrastructure/content/illustrationsSectionService";

/** Public, read-only: admin-editable copy for the landing page's "Четирите илюстрации" section. */
export async function GET() {
  await connection();
  const content = await getIllustrationsSectionContent();
  return NextResponse.json({ content });
}
