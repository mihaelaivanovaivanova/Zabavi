"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { PaymentBadges } from "@/components/landing/PaymentBadges";
import { useCookieConsent } from "@/lib/CookieConsentContext";
import { siteConfig } from "@/config/site";

const legalLinks = [
  { href: "/terms", label: "Общи условия" },
  { href: "/privacy", label: "Политика за поверителност и бисквитки" },
  { href: "/returns", label: "Право на отказ, връщане и рекламации" },
  { href: "/shipping", label: "Политика за доставка" },
];

const socialLinks = [
  { key: "instagram", label: "Instagram", href: siteConfig.social.instagram },
  { key: "facebook", label: "Facebook", href: siteConfig.social.facebook },
  { key: "tiktok", label: "TikTok", href: siteConfig.social.tiktok },
].filter((link): link is { key: string; label: string; href: string } => Boolean(link.href));

export function Footer() {
  const { openSettings } = useCookieConsent();
  const { company, contact, brand } = siteConfig;
  const [year, setYear] = useState(2026);

  useEffect(() => {
    // Reading the clock during render is blocked under Cache Components prerendering,
    // so the real year is filled in client-side after mount instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-lavender-200 bg-paper-100 py-10">
      <Container className="flex flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <Logo />

          <div className="text-sm text-ink-700">
            <h2 className="font-semibold text-ink-900">Контакти</h2>
            <p className="mt-2">{company.legalName}</p>
            <p>ЕИК: {company.eik}</p>
            <a href={`mailto:${contact.email}`} className="hover:text-burgundy-700">
              {contact.email}
            </a>
          </div>
        </div>

        <nav
          aria-label="Правна информация"
          className="flex flex-col items-center gap-2 text-center text-sm text-ink-700 sm:items-start sm:text-left"
        >
          <h2 className="font-semibold text-ink-900">Правна информация</h2>
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-burgundy-700">
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={openSettings} className="text-left hover:text-burgundy-700">
            Настройки на бисквитките
          </button>
        </nav>

        <div className="flex flex-col items-center gap-4 sm:items-end">
          {socialLinks.length > 0 ? (
            <div className="flex gap-4 text-sm text-ink-700">
              {socialLinks.map((link) => (
                <a key={link.key} href={link.href} className="hover:text-burgundy-700" target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
          <PaymentBadges />
        </div>
      </Container>

      <Container className="mt-8 text-center text-xs text-ink-500">
        © {year} {brand.name}
      </Container>
    </footer>
  );
}
