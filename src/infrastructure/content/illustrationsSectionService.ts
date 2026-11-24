import {
  defaultIllustrationsSectionContent,
  normalizeIllustrationsSectionContent,
  type IllustrationsSectionContent,
} from "@/domain/content/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

async function loadStored(): Promise<IllustrationsSectionContent | null> {
  return (await settingsRepository.get("illustrations_section")) as IllustrationsSectionContent | null;
}

/** Public, read-only: resolved copy for the landing page's "Четирите илюстрации" section. */
export async function getIllustrationsSectionContent(): Promise<IllustrationsSectionContent> {
  return normalizeIllustrationsSectionContent(await loadStored());
}

/** Same resolved content — kept as a separate export so admin and public call sites can diverge later without a rename. */
export async function getIllustrationsSectionContentForAdmin(): Promise<IllustrationsSectionContent> {
  return getIllustrationsSectionContent();
}

export async function saveIllustrationsSectionContent(content: IllustrationsSectionContent): Promise<void> {
  const normalized = normalizeIllustrationsSectionContent(content);
  await settingsRepository.save("illustrations_section", normalized as unknown as Record<string, unknown>);
}

export { defaultIllustrationsSectionContent };
