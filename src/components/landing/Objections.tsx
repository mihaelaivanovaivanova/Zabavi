"use client";

import { Section } from "@/components/ui/Section";
import { useObjectionsContent } from "@/lib/useObjectionsContent";

export function Objections() {
  const { content } = useObjectionsContent();

  return (
    <Section tone="burgundy">
      <div className="relative mx-auto max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
        <img
          src="/images/illustrations/objection-thinking.webp"
          alt=""
          aria-hidden="true"
          className="absolute -left-2 -top-6 w-14 object-contain sm:top-1/2 sm:-left-64 sm:w-64 sm:-translate-y-1/2 lg:-left-96 lg:w-96"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
        <img
          src="/images/illustrations/objection-happy.webp"
          alt=""
          aria-hidden="true"
          className="absolute -right-2 -top-6 w-14 object-contain sm:top-1/2 sm:-right-64 sm:w-64 sm:-translate-y-1/2 lg:-right-96 lg:w-96"
        />

        <h2 className="text-center text-3xl font-semibold text-paper-50">Ами ако…</h2>
        <div className="mt-10 space-y-3">
          {content.items.map((item) => (
            <div key={item.question} className="space-y-1">
              <div className="flex justify-start">
                <div className="relative max-w-[85%] px-5 py-4 sm:max-w-[70%]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor speech-bubble background, not a content photo */}
                  <img
                    src="/images/objection-bubble-question.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-fill"
                  />
                  <p className="relative text-ink-900">{item.question}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="relative max-w-[85%] px-5 py-4 sm:max-w-[70%]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor speech-bubble background, not a content photo */}
                  <img
                    src="/images/objection-bubble-answer.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-fill"
                  />
                  <p className="relative text-ink-800">{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
