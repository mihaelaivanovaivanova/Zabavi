import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Връщане и рекламации" };

export default function ReturnsPage() {
  return <LegalPage title="Връщане и рекламации" />;
}
