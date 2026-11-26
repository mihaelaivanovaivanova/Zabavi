import { Section } from "@/components/ui/Section";

const quoteLines = [
  "„Познавам те.“",
  "„Знам, че отдавна ти се рисува.“",
  "„Помня, че като малка обичаше боите.“",
  "„Виждам колко много правиш за всички. Иска ми се да отделиш време и за себе си.“",
];

const reasons = [
  {
    title: "Можеш да го избереш и за начинаещ.",
    description:
      "Не е необходимо човекът вече да рисува. Скиците и видео уроците му помагат да направи първите стъпки.",
  },
  {
    title: "Подаряваш готово преживяване.",
    description:
      "Всичко необходимо е събрано на едно място. Получателят няма нужда първо да избира бои, четки и още куп принадлежности.",
  },
  {
    title: "Качеството е част от жеста.",
    description:
      "Подбрали сме бои и четки от среден към висок клас, защото удоволствието е и в материалите, с които рисуваш.",
  },
  {
    title: "Има какво да опита и научи.",
    description:
      "Всеки видео урок показва вариант на завършена картина и техники, които могат веднага да се приложат на практика.",
  },
  {
    title: "Остава място за нещо лично.",
    description:
      "Скиците са авторски, но изборът на цветове, смелите смеси и малките отклонения принадлежат на човека с четката.",
  },
];

export function GiftMeaning() {
  return (
    <Section tone="lavender">
      <h2 className="text-center text-3xl font-semibold text-ink-900">Подарък, който казва нещо повече</h2>

      <div className="mx-auto mt-10 max-w-2xl">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-burgundy-700">Някои подаръци казват</p>
        <div className="mt-4 space-y-4">
          {quoteLines.map((line) => (
            <div key={line} className="relative mx-auto w-fit max-w-md px-6 py-5 sm:px-8 sm:max-w-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor bubble background, not a content photo */}
              <img
                src="/images/gift-reason-bubble.webp"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-fill"
              />
              <p className="relative text-center text-lg italic text-ink-800">{line}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-lg font-semibold text-ink-900">
          ЗАБАВЍ е подарък за онова нейно „някой ден ще опитам“.
        </p>
        <p className="mt-3 text-ink-700">
          Скиците дават първата посока. Видео уроците помагат, когато не знае как да продължи. А цветовете и всичко
          останало вече я чакат в кутията.
        </p>
        <p className="mt-4 font-medium text-burgundy-700">
          Ти ѝ подаряваш възможността. Тя избира кога и как да ѝ се наслади.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl divide-y divide-lavender-200">
        {reasons.map((reason) => (
          <div key={reason.title} className="flex gap-4 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative brush icon, not a content photo */}
            <img src="/icons/paintbrush.webp" alt="" aria-hidden="true" className="h-12 w-12 shrink-0" />
            <div>
              <h3 className="font-semibold text-ink-900">{reason.title}</h3>
              <p className="mt-1 text-ink-700">{reason.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
