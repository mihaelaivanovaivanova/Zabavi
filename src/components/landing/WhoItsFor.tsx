"use client";

import { useRef, useState } from "react";
import { Section } from "@/components/ui/Section";

const audiences = [
  {
    heading: "За теб, ако отдавна ти се рисува, но все отлагаш",
    image: "/images/illustrations/blank-page-worry.webp",
    paragraphs: [
      "Може би не знаеш кои бои да избереш, каква хартия ти трябва или откъде изобщо да започнеш. Тук подготовката вече е направена. Отваряш комплекта и правиш първата крачка.",
    ],
  },
  {
    heading: "За теб, ако белият лист те притеснява",
    image: "/images/illustrations/blank-page-hug.webp",
    imageSide: "right" as const,
    paragraphs: [
      "„Какво да нарисувам? Ами ако го разваля?“",
      "Авторските скици ти дават отправна точка. Не е нужно да измисляш композицията — можеш направо да започнеш да я изпълваш с цвят.",
    ],
  },
  {
    heading: "За теб, ако денят ти е пълен с грижа за другите",
    image: "/images/illustrations/caretaker-tired.webp",
    imageClassName:
      "absolute -left-4 top-1/2 w-28 -mt-44 -translate-y-1/2 object-contain sm:-left-10 sm:-mt-32 sm:w-36 lg:-left-16 lg:-mt-36 lg:w-48",
    paragraphs: [
      "За майката, която иска малко време за себе си. За човека, към когото винаги има още една молба. За онзи, който вечер осъзнава, че отново е оставил собствените си желания накрая.",
      "Не е нужно да завършиш цяла картина наведнъж. Можеш да започнеш и да се върнеш към нея, когато имаш възможност.",
    ],
  },
  {
    heading: "За теб, ако ти се иска почивка с нещо различно от скролване",
    image: "/images/illustrations/scroll-break-bench.webp",
    imageSide: "right" as const,
    imageClassName:
      "absolute -right-4 top-1/2 mt-10 w-32 -translate-y-1/2 object-contain sm:mt-24 sm:-right-14 sm:w-40 lg:-right-16 lg:mt-28 lg:w-48",
    paragraphs: [
      "Нещо, което да държиш в ръцете си. Да смесваш, да пробваш и да виждаш как се променя пред очите ти.",
      "Видео урокът ти показва как да започнеш. После можеш да го спреш и да останеш с четката, водата и цветовете.",
    ],
  },
  {
    heading: "За теб, ако обичаш да учиш чрез опитване",
    image: "/images/illustrations/learn-by-trying-joy.webp",
    imageNoIndent: true,
    imageClassName:
      "absolute bottom-0 right-14 w-28 translate-x-3 translate-y-3 object-contain sm:w-40 sm:right-24 sm:translate-x-6 sm:translate-y-6 lg:w-48 lg:right-28 lg:translate-x-8 lg:translate-y-8",
    paragraphs: [
      "Към всяка скица има видео урок с вариант на завършена картина и акварелни техники, които да приложиш на практика.",
      "Гледаш, пробваш и постепенно откриваш какво може твоята четка.",
    ],
  },
  {
    heading: "За теб, ако търсиш подарък за любим човек, а не поредния ваучер",
    image: "/images/illustrations/gift-for-loved-one.webp",
    imageSide: "right" as const,
    imageClassName:
      "absolute -right-2 top-1/2 mt-10 w-28 -translate-y-1/2 object-contain sm:mt-0 sm:-right-14 sm:w-36 lg:-right-16 lg:w-44",
    paragraphs: [
      "Омръзнало ти е от парфюми и кутии бонбони, които не казват нищо лично. Искаш нещо, което другият наистина ще отвори и ще изживее, а не ще остави в чекмеджето.",
      "ЗАБАВЍ е повод да седнете заедно с четка в ръка — или начин да подариш на любим човек малко спокойствие, което той или тя да изживее сам/а, когато поиска.",
    ],
  },
];

export function WhoItsFor() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollToIndex(nextIndex: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(audiences.length - 1, nextIndex));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <Section tone="lavender">
      <h2 className="text-center text-3xl font-semibold text-ink-900">За кого е ЗАБАВЍ?</h2>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="mx-auto flex max-w-4xl snap-x snap-mandatory gap-6 overflow-x-auto pl-4 pr-4 pt-24 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pl-0 sm:pr-0 sm:pt-0 sm:snap-none"
      >
        {audiences.map((audience) => {
          const isRight = audience.imageSide === "right";
          return (
            <div
              key={audience.heading}
              className="relative w-full shrink-0 snap-center rounded-2xl border border-lavender-200 bg-paper-50 p-6 sm:w-auto sm:shrink"
            >
              {audience.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- decorative illustration, not a content photo
                <img
                  src={audience.image}
                  alt=""
                  aria-hidden="true"
                  className={
                    audience.imageClassName ??
                    (isRight
                      ? "absolute -right-2 top-1/2 mt-10 w-24 -translate-y-1/2 object-contain sm:mt-0 sm:-right-12 sm:w-20 lg:-right-6 lg:w-24"
                      : "absolute -left-4 top-1/2 w-28 -mt-44 -translate-y-1/2 object-contain sm:-left-16 sm:-mt-16 sm:w-24 lg:-left-18 lg:w-32")
                  }
                />
              ) : null}
              <div
                className={`relative p-3 ${
                  audience.image && !audience.imageNoIndent ? (isRight ? "sm:mr-10 lg:mr-14" : "ml-16 sm:ml-10 lg:ml-14") : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative torn-paper heading background, not a content photo */}
                <img
                  src="/images/bonus-banner.webp"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-fill"
                />
                <h3 className="relative text-lg font-semibold text-ink-900">{audience.heading}</h3>
              </div>
              {audience.paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className={`mt-3 text-ink-700 ${audience.image && isRight ? "mr-16 sm:mr-10 lg:mr-14" : ""}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-2 sm:hidden">
        {audiences.map((audience, i) => (
          <button
            key={audience.heading}
            type="button"
            aria-label={`Карта ${i + 1}`}
            onClick={() => scrollToIndex(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-burgundy-700" : "bg-lavender-300"}`}
          />
        ))}
      </div>
    </Section>
  );
}
