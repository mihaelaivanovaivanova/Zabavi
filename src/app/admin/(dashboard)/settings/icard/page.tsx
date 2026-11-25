import { Suspense } from "react";
import { connection } from "next/server";
import { getICardSettingsForAdmin } from "@/infrastructure/settings/icardSettingsService";
import { ICardSettingsForm } from "@/components/admin/ICardSettingsForm";
import { SettingsNav } from "@/components/admin/SettingsNav";

export default function ICardSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Настройки</h1>
      <p className="mt-2 text-sm text-ink-700">iCard — плащания с карта.</p>

      <SettingsNav />

      <Suspense fallback={<p className="mt-8 text-ink-700">Зареждане…</p>}>
        <ICardSettingsSection />
      </Suspense>
    </div>
  );
}

async function ICardSettingsSection() {
  await connection();
  const icard = await getICardSettingsForAdmin();

  return (
    <div className="mt-8">
      <ICardSettingsForm initial={icard} />
    </div>
  );
}
