import { Section } from "@/components/ui/Section";

const steps = [
  {
    title: "Избери илюстрация",
    description: "Всяко от четирите платна има готов контур — просто избери коя композиция ти говори днес.",
  },
  {
    title: "Смеси цветовете",
    description: "Шестте акварелни капки се разтварят с няколко капки вода директно върху палитрата.",
  },
  {
    title: "Рисувай без бързане",
    description: "Контурите водят ръката ти — няма грешни решения, само момент спокойствие с четка в ръка.",
  },
];

export function HowItWorks() {
  return (
    <Section tone="paper">
      <h2 className="text-center text-3xl font-semibold text-ink-900">Как протича рисуването</h2>
      <ol className="mt-10 grid gap-8 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-burgundy-700 font-serif text-lg text-paper-50">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
            <p className="mt-2 text-ink-700">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
