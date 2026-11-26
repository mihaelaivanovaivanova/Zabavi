import { Suspense } from "react";
import { connection } from "next/server";
import { getBoxNowSettingsForAdmin } from "@/infrastructure/settings/boxNowSettingsService";
import { getSpeedySettingsForAdmin } from "@/infrastructure/settings/speedySettingsService";
import { getCodFeeEur } from "@/infrastructure/settings/checkoutSettingsService";
import { BoxNowSettingsForm } from "@/components/admin/BoxNowSettingsForm";
import { SpeedySettingsForm } from "@/components/admin/SpeedySettingsForm";
import { CodFeeSettingsForm } from "@/components/admin/CodFeeSettingsForm";
import { SettingsNav } from "@/components/admin/SettingsNav";

export default function ShippingSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Настройки</h1>
      <p className="mt-2 text-sm text-ink-700">Доставка — BOX NOW и Speedy.</p>

      <SettingsNav />

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <ShippingSettingsSections />
      </Suspense>
    </div>
  );
}

async function ShippingSettingsSections() {
  await connection();
  const [boxNow, speedy, codFeeEur] = await Promise.all([
    getBoxNowSettingsForAdmin(),
    getSpeedySettingsForAdmin(),
    getCodFeeEur(),
  ]);

  return (
    <div className="mt-8 space-y-8">
      <BoxNowSettingsForm initial={boxNow} />
      <SpeedySettingsForm initial={speedy} />
      <CodFeeSettingsForm initial={{ codFeeEur }} />
    </div>
  );
}
