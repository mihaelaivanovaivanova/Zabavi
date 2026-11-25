"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/settings", label: "Общи" },
  { href: "/admin/settings/shipping", label: "Доставка" },
  { href: "/admin/settings/icard", label: "iCard" },
  { href: "/admin/settings/meta-pixel", label: "Meta Pixel" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-lavender-200">
      {links.map((link) => {
        const isActive = link.href === "/admin/settings" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-semibold ${
              isActive ? "border-accent-500 text-ink-900" : "border-transparent text-ink-700 hover:text-ink-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
