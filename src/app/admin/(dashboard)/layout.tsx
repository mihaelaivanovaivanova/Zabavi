import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-lavender-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-lavender-200 bg-paper-50 px-4 py-6">
        <div className="px-2">
          <Logo variant="lockup" className="h-10 w-auto" />
        </div>
        <AdminNav className="mt-8" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-lavender-200 bg-paper-50 px-8 py-4">
          <LogoutButton />
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
