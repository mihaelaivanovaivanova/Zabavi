"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Поръчки" },
  { href: "/admin/kits", label: "Комплекти" },
  { href: "/admin/settings", label: "Настройки" },
];

export function AdminNav({
  className,
  orientation = "vertical",
}: {
  className?: string;
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  return (
    <nav
      className={`flex gap-1 ${orientation === "vertical" ? "flex-col" : "overflow-x-auto"} ${className ?? ""}`}
    >
      {links.map((link) => {
        const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              orientation === "vertical"
                ? `rounded-lg border-l-4 px-4 py-2 text-sm font-semibold ${
                    isActive
                      ? "border-accent-500 bg-lavender-50 text-ink-900"
                      : "border-transparent text-ink-700 hover:bg-lavender-50 hover:text-ink-900"
                  }`
                : `shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    isActive ? "bg-burgundy-800 text-paper-50" : "bg-lavender-50 text-ink-700"
                  }`
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
