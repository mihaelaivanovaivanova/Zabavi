import { SettingsNav } from "@/components/admin/SettingsNav";

export default function MetaPixelSettingsPage() {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Настройки</h1>
      <p className="mt-2 text-sm text-ink-700">Meta Pixel.</p>

      <SettingsNav />

      <div className="mt-8 rounded-2xl border border-lavender-200 bg-paper-50 p-6">
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
