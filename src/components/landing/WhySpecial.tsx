import { Section } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";

export function WhySpecial() {
  return (
    <Section tone="paper">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold text-ink-900">Какво прави подаръка специален</h2>
        <p className="mt-5 text-lg text-ink-800">{siteConfig.brand.description}</p>
        <p className="mt-4 text-ink-700">
          Това не е просто творчески комплект — това е покана да спреш, да поемеш дъх и да отделиш момент
          само за себе си или за човек, на когото държиш.
        </p>
      </div>
    </Section>
  );
}
