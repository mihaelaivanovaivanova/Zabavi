import {
  defaultBoxNowMarketingContent,
  normalizeBoxNowMarketingContent,
  type BoxNowMarketingContent,
} from "@/domain/content/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

async function loadStored(): Promise<BoxNowMarketingContent | null> {
  return (await settingsRepository.get("box_now_marketing")) as BoxNowMarketingContent | null;
}

/** Public, read-only: resolved copy/visibility for the top banner + homepage BOX NOW badge. */
export async function getBoxNowMarketingContent(): Promise<BoxNowMarketingContent> {
  return normalizeBoxNowMarketingContent(await loadStored());
}

export async function getBoxNowMarketingContentForAdmin(): Promise<BoxNowMarketingContent> {
  return getBoxNowMarketingContent();
}

export async function saveBoxNowMarketingContent(content: BoxNowMarketingContent): Promise<void> {
  const normalized = normalizeBoxNowMarketingContent(content);
  await settingsRepository.save("box_now_marketing", normalized as unknown as Record<string, unknown>);
}

export { defaultBoxNowMarketingContent };
