import { Section } from "@/components/ui/Section";

const scenarios = [
  "Рожден ден на човек, който „има всичко“",
  "Благодарност към приятел или колега",
  "Повод да спрете и да създадете нещо заедно",
  "Подарък за себе си — просто така",
];

export function GiftingScenarios() {
  return (
    <Section tone="paper">
      <h2 className="text-center text-3xl font-semibold text-ink-900">Кога да го подариш</h2>
      <ul className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
        {scenarios.map((scenario) => (
          <li
            key={scenario}
            className="rounded-xl border border-lavender-200 bg-lavender-50 px-5 py-4 text-ink-800"
          >
            {scenario}
          </li>
        ))}
      </ul>
    </Section>
  );
}
