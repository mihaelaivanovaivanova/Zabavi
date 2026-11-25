import { Suspense } from "react";
import { connection } from "next/server";
import { getICardSettingsForAdmin } from "@/infrastructure/settings/icardSettingsService";
import { getBoxNowSettingsForAdmin } from "@/infrastructure/settings/boxNowSettingsService";
import { getSpeedySettingsForAdmin } from "@/infrastructure/settings/speedySettingsService";
import { getIllustrationsSectionContentForAdmin } from "@/infrastructure/content/illustrationsSectionService";
import { getFaqContentForAdmin } from "@/infrastructure/content/faqService";
import { ICardSettingsForm } from "@/components/admin/ICardSettingsForm";
import { BoxNowSettingsForm } from "@/components/admin/BoxNowSettingsForm";
import { SpeedySettingsForm } from "@/components/admin/SpeedySettingsForm";
import { IllustrationsSectionForm } from "@/components/admin/IllustrationsSectionForm";
import { FaqSectionForm } from "@/components/admin/FaqSectionForm";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Настройки на интеграциите</h1>
      <p className="mt-2 text-sm text-ink-700">
        {process.env.DATABASE_URL
          ? "Настройките се пазят в реална база данни (Postgres) и секретите се съхраняват криптирани."
          : "Демо хранилище в паметта на сървъра — настройките се изчистват при всеки рестарт, не е реална база данни."}
      </p>

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <SettingsSections />
      </Suspense>
    </div>
  );
}

async function SettingsSections() {
  // Same reasoning as the orders/kits admin pages: these reads have no
  // request-time signal of their own, so opt out of the static shell.
  await connection();
  const [icard, boxNow, speedy, illustrationsSection, faq] = await Promise.all([
    getICardSettingsForAdmin(),
    getBoxNowSettingsForAdmin(),
    getSpeedySettingsForAdmin(),
    getIllustrationsSectionContentForAdmin(),
    getFaqContentForAdmin(),
  ]);

  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <div className="mt-8 space-y-8">
      <IllustrationsSectionForm initial={illustrationsSection} />
      <FaqSectionForm initial={faq} />
      <ICardSettingsForm initial={icard} />
      <BoxNowSettingsForm initial={boxNow} />
      <SpeedySettingsForm initial={speedy} />

      <div className="rounded-2xl border border-lavender-200 bg-paper-50 p-6">
        <h2 className="text-lg font-semibold text-ink-900">Meta Pixel</h2>
        <p className="mt-2 text-sm text-ink-700">
          {metaPixelId
            ? `Зареден само след съгласие за "Маркетингови" бисквитки (ID: ${metaPixelId}).`
            : "Не е зададен — NEXT_PUBLIC_META_PIXEL_ID липсва, пикселът остава изключен."}
        </p>
        <p className="mt-2 text-sm text-ink-700">
          Задава се чрез променлива на средата (не през тази страница), по същия начин като на smisul.bg — зареждането
          е обвързано с категорията „Маркетингови“ в банера за бисквитки.
        </p>
      </div>
    </div>
  );
}
