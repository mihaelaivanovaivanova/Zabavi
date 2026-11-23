import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-lavender-50 sm:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-lavender-200 bg-paper-50 px-4 py-6 sm:flex">
        <div className="px-2">
          <Link href="/">
            <Logo className="h-10 w-auto" />
          </Link>
        </div>
        <AdminNav className="mt-8" />
      </aside>

      <header className="flex items-center justify-between gap-4 border-b border-lavender-200 bg-paper-50 px-4 py-3 sm:hidden">
        <Link href="/">
          <Logo className="h-8 w-auto" />
        </Link>
        <LogoutButton />
      </header>
      <div className="border-b border-lavender-200 bg-paper-50 px-4 py-2 sm:hidden">
        <AdminNav orientation="horizontal" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end border-b border-lavender-200 bg-paper-50 px-8 py-4 sm:flex">
          <LogoutButton />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
