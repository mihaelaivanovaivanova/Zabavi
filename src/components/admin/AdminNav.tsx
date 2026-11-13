"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Поръчки" },
  { href: "/admin/kits", label: "Комплекти" },
];

export function AdminNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={`flex flex-col gap-1 ${className ?? ""}`}>
      {links.map((link) => {
        const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg border-l-4 px-4 py-2 text-sm font-semibold ${
              isActive
                ? "border-accent-500 bg-lavender-50 text-ink-900"
                : "border-transparent text-ink-700 hover:bg-lavender-50 hover:text-ink-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
