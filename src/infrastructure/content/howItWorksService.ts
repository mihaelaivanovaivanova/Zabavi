import {
  defaultHowItWorksContent,
  normalizeHowItWorksContent,
  type HowItWorksContent,
} from "@/domain/content/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

async function loadStored(): Promise<HowItWorksContent | null> {
  return (await settingsRepository.get("how_it_works")) as HowItWorksContent | null;
}

/** Public, read-only: resolved copy for the landing page's "Как протича рисуването" section. */
export async function getHowItWorksContent(): Promise<HowItWorksContent> {
  return normalizeHowItWorksContent(await loadStored());
}

export async function getHowItWorksContentForAdmin(): Promise<HowItWorksContent> {
  return getHowItWorksContent();
}

export async function saveHowItWorksContent(content: HowItWorksContent): Promise<void> {
  const normalized = normalizeHowItWorksContent(content);
  await settingsRepository.save("how_it_works", normalized as unknown as Record<string, unknown>);
}

export { defaultHowItWorksContent };
