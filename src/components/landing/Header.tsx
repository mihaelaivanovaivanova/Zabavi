import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-lavender-200/60 bg-paper-100/90 backdrop-blur">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" aria-label="ЗАБАВЍ — начало">
          <Logo />
        </Link>
        <LinkButton href="/checkout" variant="primary" className="text-xs sm:text-sm">
          Поръчай
        </LinkButton>
      </Container>
    </header>
  );
}
