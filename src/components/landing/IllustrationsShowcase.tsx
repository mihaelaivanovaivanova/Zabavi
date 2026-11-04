import { Section } from "@/components/ui/Section";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { product } from "@/config/site";

export function IllustrationsShowcase() {
  return (
    <Section tone="lavender">
      <h2 className="text-center text-3xl font-semibold text-ink-900">Четирите илюстрации</h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-ink-700">
        Всяка кутия включва четири готови композиции с контури — достатъчно разнообразни, за да избереш
        настроението на момента.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {product.illustrations.map((illustration) => (
          <div key={illustration.title}>
            <PlaceholderImage label={illustration.image.label} alt={illustration.image.alt} aspect="portrait" />
            <h3 className="mt-3 text-center font-medium text-ink-900">{illustration.title}</h3>
            <p className="mt-1 text-center text-sm text-ink-700">{illustration.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
