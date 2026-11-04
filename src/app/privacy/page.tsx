import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Поверителност" };

export default function PrivacyPage() {
  return <LegalPage title="Политика за поверителност" />;
}
