import { Section } from "@/components/ui/Section";
import { trustContent } from "@/config/site";

export function TrustAndDelivery() {
  const items = [
    { title: "Доставка", text: trustContent.shipping },
    { title: "Връщане", text: trustContent.returns },
    { title: "Плащане", text: trustContent.payment },
  ];

  return (
    <Section tone="lavender">
      <h2 className="text-center text-3xl font-semibold text-ink-900">Доверие и доставка</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl bg-paper-50 p-6">
            <h3 className="font-semibold text-ink-900">{item.title}</h3>
            <p className="mt-2 text-sm text-ink-700">{item.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
