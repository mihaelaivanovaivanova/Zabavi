import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { product, siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="bg-lavender-50 pb-16 pt-12 sm:pb-24 sm:pt-20">
      <Container className="grid items-center gap-10 sm:grid-cols-2">
        <div className="order-2 sm:order-1">
          <h1 className="text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
            {siteConfig.brand.tagline}
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-800">{product.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <LinkButton href="/checkout" variant="primary">
              Подари си момент
            </LinkButton>
            <LinkButton href="#whats-inside" variant="ghost">
              Виж какво има в кутията
            </LinkButton>
          </div>
        </div>
        <div className="order-1 sm:order-2">
          <PlaceholderImage label={product.heroImage.label} alt={product.heroImage.alt} aspect="square" />
        </div>
      </Container>
    </section>
  );
}
