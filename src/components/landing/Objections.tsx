"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/ui/Section";
import { useObjectionsContent } from "@/lib/useObjectionsContent";

/** How long the question shows alone before the answer appears underneath it, as if being typed/spoken in reply. */
const ANSWER_DELAY_MS = 2000;

/** How long the answer itself stays visible before the view advances to the next pair. */
const ANSWER_VISIBLE_MS = 6000;

export function Objections() {
  const { content } = useObjectionsContent();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Each time the pair changes: the question "lands" first, then (after
  // ANSWER_DELAY_MS) the reply follows, then (ANSWER_VISIBLE_MS after THAT —
  // not from when the question appeared) the view advances to the next
  // pair — only matters for the mobile one-at-a-time view (see the
  // "sm:hidden" block below); the desktop/tablet view shows every pair at
  // once and never reads activeIndex/showAnswer.
  useEffect(() => {
    setShowAnswer(false);
    const revealTimer = setTimeout(() => setShowAnswer(true), ANSWER_DELAY_MS);

    let advanceTimer: ReturnType<typeof setTimeout> | undefined;
    if (content.items.length > 1) {
      advanceTimer = setTimeout(() => {
        setActiveIndex((current) => (current + 1) % content.items.length);
      }, ANSWER_DELAY_MS + ANSWER_VISIBLE_MS);
    }

    return () => {
      clearTimeout(revealTimer);
      if (advanceTimer) clearTimeout(advanceTimer);
    };
  }, [activeIndex, content.items.length]);

  // Guards against activeIndex pointing past the end if the admin-edited
  // list shrinks (e.g. an item removed) between renders.
  const safeIndex = content.items.length > 0 ? activeIndex % content.items.length : 0;
  const current = content.items[safeIndex];

  return (
    <Section tone="burgundy">
      <div className="relative mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-semibold text-paper-50">Ами ако…</h2>

        {/* Mobile: one question/answer pair at a time, cycling every 5s, with
            the two characters below it so they read as the ones "talking" —
            each bubble's tail already points toward its matching character
            (left bubble/left "thinking" character, right bubble/right
            "happy" character), see the bubble artwork itself.

            Every pair is rendered at once, all stacked on the same CSS grid
            cell ("[grid-area:1/1]" on each) — the grid auto-sizes that cell
            to the tallest pair among ALL of them, so the section's height is
            one constant value across every question, not just within one
            question's own reveal. Only the active pair is visible/opaque. */}
        {current ? (
          <div data-testid="objection-mobile-grid" className="mt-10 grid sm:hidden">
            {content.items.map((item, index) => {
              const isActive = index === safeIndex;
              return (
                <div
                  key={item.question}
                  data-active={isActive}
                  {...(isActive ? { "data-testid": "objection-current" } : {})}
                  className={`space-y-1 [grid-area:1/1] transition-opacity duration-500 ${
                    isActive ? "opacity-100" : "invisible opacity-0"
                  }`}
                >
                  <div className="flex justify-start">
                    <div className="relative max-w-[85%] px-5 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor speech-bubble background, not a content photo */}
                      <img
                        src="/images/objection-bubble-question.webp"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-fill"
                      />
                      <p className="relative text-center text-ink-900">{item.question}</p>
                    </div>
                  </div>
                  {/* The answer's own space is reserved the same way (and
                      stays part of this pair's own max-height contribution)
                      so revealing it never grows the section either — only
                      its visibility fades in, a beat after the question. */}
                  <div
                    {...(isActive ? { "data-testid": "objection-answer" } : {})}
                    className={`flex justify-end transition-opacity duration-500 ${
                      isActive && showAnswer ? "opacity-100" : "invisible opacity-0"
                    }`}
                  >
                    <div className="relative max-w-[85%] px-5 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor speech-bubble background, not a content photo */}
                      <img
                        src="/images/objection-bubble-answer.webp"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-fill"
                      />
                      <p className="relative text-center text-ink-800">{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-8 flex items-end justify-between sm:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
          <img
            src="/images/illustrations/objection-thinking.webp"
            alt=""
            aria-hidden="true"
            className="w-40 object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
          <img
            src="/images/illustrations/objection-happy.webp"
            alt=""
            aria-hidden="true"
            className="w-40 object-contain"
          />
        </div>

        {/* Desktop/tablet: every pair at once, with the two characters large
            and fixed at the sides — unchanged from before. */}
        <div className="hidden sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
          <img
            src="/images/illustrations/objection-thinking.webp"
            alt=""
            aria-hidden="true"
            className="absolute top-1/2 -left-64 w-64 -translate-y-1/2 object-contain lg:-left-96 lg:w-96"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
          <img
            src="/images/illustrations/objection-happy.webp"
            alt=""
            aria-hidden="true"
            className="absolute top-1/2 -right-64 w-64 -translate-y-1/2 object-contain lg:-right-96 lg:w-96"
          />

          <div className="mt-10 space-y-3">
            {content.items.map((item) => (
              <div key={item.question} className="space-y-1">
                <div className="flex justify-start">
                  <div className="relative max-w-[70%] px-5 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor speech-bubble background, not a content photo */}
                    <img
                      src="/images/objection-bubble-question.webp"
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-fill"
                    />
                    <p className="relative text-center text-ink-900">{item.question}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="relative max-w-[70%] px-5 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor speech-bubble background, not a content photo */}
                    <img
                      src="/images/objection-bubble-answer.webp"
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-fill"
                    />
                    <p className="relative text-center text-ink-800">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
