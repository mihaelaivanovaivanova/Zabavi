"use client";

import { Section } from "@/components/ui/Section";
import { useHowItWorksContent } from "@/lib/useHowItWorksContent";

export function HowItWorks() {
  const { content } = useHowItWorksContent();

  return (
    <Section tone="lavender">
      <h2 className="text-center text-3xl font-semibold text-ink-900">{content.heading}</h2>
      <ol className="mx-auto mt-10 max-w-2xl space-y-8">
        {content.steps.map((step, index) => (
          <li key={index} className="flex gap-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy-700 font-serif text-lg text-paper-50">
              {index + 1}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-ink-700">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
