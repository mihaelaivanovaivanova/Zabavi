import { Section } from "@/components/ui/Section";

const benefits = [
  {
    title: "Момент само за теб",
    description: "Няколко минути с четка в ръка, далеч от екрани и задачи.",
  },
  {
    title: "Без нужда от опит",
    description: "Готовите контури правят първата крачка в акварела лека и безопасна.",
  },
  {
    title: "Подарък с грижа",
    description: "Опаковка с панделка и място за лично послание — готов за подаряване директно от кутията.",
  },
];

export function Benefits() {
  return (
    <Section tone="burgundy">
      <h2 className="text-center text-3xl font-semibold">Защо си заслужава</h2>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="text-center">
            <h3 className="text-lg font-semibold">{benefit.title}</h3>
            <p className="mt-2 text-paper-100/90">{benefit.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
