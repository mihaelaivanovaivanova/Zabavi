import { LinkButton } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Section } from "@/components/ui/Section";
import { formatBgn } from "@/lib/format";
import { product } from "@/config/site";

export function ProductOffer() {
  return (
    <Section id="product" tone="lavender">
      <div className="grid gap-10 rounded-3xl bg-paper-50 p-8 sm:grid-cols-2 sm:p-12">
        <PlaceholderImage label={product.heroImage.label} alt={product.heroImage.alt} aspect="square" />
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-semibold text-ink-900">{product.name}</h2>
          <p className="mt-3 text-ink-700">{product.description}</p>
          <p className="mt-6 text-2xl font-semibold text-burgundy-700">{formatBgn(product.priceBgn)}</p>
          <LinkButton href="/checkout" variant="primary" className="mt-6 self-start">
            Поръчай сега
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
