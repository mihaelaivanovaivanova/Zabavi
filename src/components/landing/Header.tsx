import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-lavender-200/60 bg-paper-100/90 backdrop-blur">
      <Container className="grid grid-cols-[1fr_auto_1fr] items-center py-2">
        <div />
        <Link href="/" aria-label="ЗАБАВЍ — начало" className="justify-self-center">
          <Logo className="h-16 w-auto sm:h-20" />
        </Link>
        <Link
          href="/checkout"
          aria-label="Количка / Поръчка"
          className="justify-self-end opacity-90 transition-opacity hover:opacity-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, rendered as a crisp vector, not an optimized raster */}
          <img src="/brand/zabavi-cart.svg" alt="" width={48} height={48} className="h-7 w-7" />
        </Link>
      </Container>
    </header>
  );
}
