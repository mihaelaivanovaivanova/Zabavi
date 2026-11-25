import { Section } from "@/components/ui/Section";

const objections = [
  {
    question: "…не мога да рисувам?",
    answer:
      "Можеш да започнеш и без предишен опит. Скиците ти дават основата, а видео уроците показват вариант за рисуване и техники, които да опиташ.",
  },
  {
    question: "…объркам нещо?",
    answer:
      "Не всяка непланирана следа трябва да се поправя. Понякога можеш да я включиш в картината, да промениш посоката или просто да опиташ различно следващия път. Тук няма оценяване.",
  },
  {
    question: "…нямам много свободно време?",
    answer: "Не е нужно да рисуваш всичко наведнъж. Можеш да разделиш работата на части и да продължиш в друг ден.",
  },
  {
    question: "…искам да науча техники, а не само да оцветявам?",
    answer:
      "Във видео уроците има техники, които да приложиш върху скиците. Можеш да се упражняваш и да използваш наученото и в следващи собствени рисунки.",
  },
  {
    question: "…не искам да следвам урока?",
    answer:
      "Можеш да използваш само отделни насоки или да рисуваш изцяло по свой начин. Изборът на цветове и крайният вид на картината са твои.",
  },
];

export function Objections() {
  return (
    <Section tone="burgundy">
      <div className="relative mx-auto max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
        <img
          src="/images/illustrations/objection-thinking.webp"
          alt=""
          aria-hidden="true"
          className="absolute -left-2 -top-6 w-14 object-contain sm:-left-24 sm:-top-10 sm:w-28 lg:-left-32 lg:w-36"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative character illustration, not a content photo */}
        <img
          src="/images/illustrations/objection-happy.webp"
          alt=""
          aria-hidden="true"
          className="absolute -right-2 -top-6 w-14 object-contain sm:-right-24 sm:-top-10 sm:w-28 lg:-right-32 lg:w-36"
        />

        <h2 className="text-center text-3xl font-semibold text-paper-50">Ами ако…</h2>
        <div className="mt-10 space-y-6">
          {objections.map((item) => (
            <div key={item.question} className="space-y-2">
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
