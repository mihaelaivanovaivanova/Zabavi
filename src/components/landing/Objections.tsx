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
      <h2 className="text-center text-3xl font-semibold">Ами ако…</h2>
      <div className="mx-auto mt-10 max-w-2xl space-y-6">
        {objections.map((item) => (
          <div key={item.question} className="space-y-2">
            <div className="flex justify-start">
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-paper-50/10 px-4 py-3 text-paper-50 sm:max-w-[70%]">
                {item.question}
              </p>
            </div>
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-paper-50 px-4 py-3 text-ink-800 sm:max-w-[70%]">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
