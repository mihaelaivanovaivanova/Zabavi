import { Suspense } from "react";
import { connection } from "next/server";
import { getBoxNowSettingsForAdmin } from "@/infrastructure/settings/boxNowSettingsService";
import { getSpeedySettingsForAdmin } from "@/infrastructure/settings/speedySettingsService";
import { getCodFeeEur } from "@/infrastructure/settings/checkoutSettingsService";
import { getShippingPrices } from "@/infrastructure/settings/shippingPricesService";
import { getBoxNowMarketingContentForAdmin } from "@/infrastructure/content/boxNowMarketingService";
import { BoxNowSettingsForm } from "@/components/admin/BoxNowSettingsForm";
import { SpeedySettingsForm } from "@/components/admin/SpeedySettingsForm";
import { CodFeeSettingsForm } from "@/components/admin/CodFeeSettingsForm";
import { DeliveryPricesForm } from "@/components/admin/DeliveryPricesForm";
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
  const [boxNow, speedy, codFeeEur, boxNowMarketing, shippingPrices] = await Promise.all([
    getBoxNowSettingsForAdmin(),
    getSpeedySettingsForAdmin(),
    getCodFeeEur(),
    getBoxNowMarketingContentForAdmin(),
    getShippingPrices(),
  ]);

  return (
    <div className="mt-8 space-y-8">
      <BoxNowSettingsForm initial={boxNow} initialMarketing={boxNowMarketing} />
      <SpeedySettingsForm initial={speedy} />
      <DeliveryPricesForm initial={shippingPrices} />
      <CodFeeSettingsForm initial={{ codFeeEur }} />
    </div>
  );
}
