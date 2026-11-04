import { Section } from "@/components/ui/Section";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { product } from "@/config/site";

export function WhatsInTheBox() {
  return (
    <Section id="whats-inside" tone="lavender">
      <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
        <PlaceholderImage
          label="Съдържание на кутията"
          alt="Разложено съдържание на акварелния creative kit"
          aspect="wide"
        />
        <div>
          <h2 className="text-3xl font-semibold text-ink-900">Какво има в кутията</h2>
          <ul className="mt-6 space-y-3">
            {product.boxContents.map((item) => (
              <li key={item} className="flex gap-3 text-ink-800">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
