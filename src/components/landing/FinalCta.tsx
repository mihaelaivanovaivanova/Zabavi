import { LinkButton } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export function FinalCta() {
  return (
    <Section tone="burgundy" className="text-center">
      <h2 className="text-3xl font-semibold">Готов/а ли си да забавиш темпото?</h2>
      <p className="mx-auto mt-4 max-w-xl text-paper-100/90">
        Подари си или на някой друг момент на спокойствие, цвят и творчество.
      </p>
      <LinkButton href="/checkout" variant="secondary" className="mt-8">
        Поръчай сега
      </LinkButton>
    </Section>
  );
}
