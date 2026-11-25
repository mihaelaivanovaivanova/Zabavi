import { defaultFaqContent, normalizeFaqContent, type FaqContent } from "@/domain/content/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

async function loadStored(): Promise<FaqContent | null> {
  return (await settingsRepository.get("faq")) as FaqContent | null;
}

/** Public, read-only: resolved items for the landing page's FAQ section. */
export async function getFaqContent(): Promise<FaqContent> {
  return normalizeFaqContent(await loadStored());
}

/** Same resolved content — kept as a separate export so admin and public call sites can diverge later without a rename. */
export async function getFaqContentForAdmin(): Promise<FaqContent> {
  return getFaqContent();
}

export async function saveFaqContent(content: FaqContent): Promise<void> {
  const normalized = normalizeFaqContent(content);
  await settingsRepository.save("faq", normalized as unknown as Record<string, unknown>);
}

export { defaultFaqContent };
