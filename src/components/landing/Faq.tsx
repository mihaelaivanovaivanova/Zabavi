"use client";

import { Section } from "@/components/ui/Section";
import { useFaqContent } from "@/lib/useFaqContent";

export function Faq() {
  const { content } = useFaqContent();

  return (
    <Section tone="lavender">
      <h2 className="text-center text-3xl font-semibold text-ink-900">Други често задавани въпроси</h2>
      <div className="mx-auto mt-10 max-w-2xl divide-y divide-lavender-200">
        {content.items.map((item) => (
          <details key={item.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink-900 [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden="true" className="shrink-0 text-ink-700 transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <p className="mt-2 text-ink-700">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
