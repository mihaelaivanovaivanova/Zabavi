import { Section } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";

export function WhySpecial() {
  return (
    <Section tone="lavender">
      <div className="relative mx-auto max-w-4xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative watercolor background, not a content photo */}
        <img src="/images/heart-banner.webp" alt="" aria-hidden="true" className="w-full h-auto" />
        <div className="absolute inset-0 flex items-center justify-center p-10 sm:p-16">
          <div className="max-w-sm text-center sm:max-w-lg">
            <h2 className="text-xl font-semibold text-ink-900 sm:text-3xl">Какво прави подаръка специален</h2>
            <p className="mt-2 text-sm text-ink-800 sm:mt-5 sm:text-lg">{siteConfig.brand.description}</p>
            <p className="mt-2 text-xs text-ink-700 sm:mt-4 sm:text-base">
              Това не е просто творчески комплект — това е покана да спреш, да поемеш дъх и да отделиш момент
              само за себе си или за човек, на когото държиш.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
