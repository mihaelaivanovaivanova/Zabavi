import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Общи условия" };

export default function TermsPage() {
  return <LegalPage title="Общи условия" />;
}
