import { Suspense } from "react";
import { connection } from "next/server";
import { getIllustrationsSectionContentForAdmin } from "@/infrastructure/content/illustrationsSectionService";
import { getHowItWorksContentForAdmin } from "@/infrastructure/content/howItWorksService";
import { getFaqContentForAdmin } from "@/infrastructure/content/faqService";
import { getObjectionsContentForAdmin } from "@/infrastructure/content/objectionsService";
import { IllustrationsSectionForm } from "@/components/admin/IllustrationsSectionForm";
import { HowItWorksSectionForm } from "@/components/admin/HowItWorksSectionForm";
import { FaqSectionForm } from "@/components/admin/FaqSectionForm";
import { ObjectionsSectionForm } from "@/components/admin/ObjectionsSectionForm";
import { SettingsNav } from "@/components/admin/SettingsNav";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Настройки</h1>
      <p className="mt-2 text-sm text-ink-700">
        {process.env.DATABASE_URL
          ? "Настройките се пазят в реална база данни (Postgres) и секретите се съхраняват криптирани."
          : "Демо хранилище в паметта на сървъра — настройките се изчистват при всеки рестарт, не е реална база данни."}
      </p>

      <SettingsNav />

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <ContentSettingsSections />
      </Suspense>
    </div>
  );
}

async function ContentSettingsSections() {
  // Same reasoning as the orders/kits admin pages: these reads have no
  // request-time signal of their own, so opt out of the static shell.
  await connection();
  const [illustrationsSection, howItWorks, faq, objections] = await Promise.all([
    getIllustrationsSectionContentForAdmin(),
    getHowItWorksContentForAdmin(),
    getFaqContentForAdmin(),
    getObjectionsContentForAdmin(),
  ]);

  return (
    <div className="mt-8 space-y-8">
      <IllustrationsSectionForm initial={illustrationsSection} />
      <HowItWorksSectionForm initial={howItWorks} />
      <FaqSectionForm initial={faq} />
      <ObjectionsSectionForm initial={objections} />
    </div>
  );
}
