import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

const legalLinks = [
  { href: "/terms", label: "Общи условия" },
  { href: "/privacy", label: "Поверителност" },
  { href: "/returns", label: "Връщане и рекламации" },
];

export function Footer() {
  return (
    <footer className="border-t border-lavender-200 bg-paper-100 py-10">
      <Container className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo />
        <nav aria-label="Правна информация" className="flex flex-wrap justify-center gap-4 text-sm text-ink-700">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-burgundy-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-ink-700">
          <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-burgundy-700">
            {siteConfig.contact.email}
          </a>
        </p>
      </Container>
    </footer>
  );
}
