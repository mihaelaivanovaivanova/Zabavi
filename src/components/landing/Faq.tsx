"use client";

import { Section } from "@/components/ui/Section";
import { useFaqContent } from "@/lib/useFaqContent";

export function Faq() {
  const { content } = useFaqContent();

  return (
    <Section tone="paper">
      <h2 className="text-center text-3xl font-semibold text-ink-900">Често задавани въпроси</h2>
      <dl className="mx-auto mt-10 max-w-2xl divide-y divide-lavender-200">
        {content.items.map((item) => (
          <div key={item.question} className="py-5">
            <dt className="font-medium text-ink-900">{item.question}</dt>
            <dd className="mt-2 text-ink-700">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
