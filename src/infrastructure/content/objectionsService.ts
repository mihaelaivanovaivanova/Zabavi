import { defaultObjectionsContent, normalizeObjectionsContent, type ObjectionsContent } from "@/domain/content/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";

async function loadStored(): Promise<ObjectionsContent | null> {
  return (await settingsRepository.get("objections")) as ObjectionsContent | null;
}

/** Public, read-only: resolved items for the landing page's "Ами ако…" section. */
export async function getObjectionsContent(): Promise<ObjectionsContent> {
  return normalizeObjectionsContent(await loadStored());
}

/** Same resolved content — kept as a separate export so admin and public call sites can diverge later without a rename. */
export async function getObjectionsContentForAdmin(): Promise<ObjectionsContent> {
  return getObjectionsContent();
}

export async function saveObjectionsContent(content: ObjectionsContent): Promise<void> {
  const normalized = normalizeObjectionsContent(content);
  await settingsRepository.save("objections", normalized as unknown as Record<string, unknown>);
}

export { defaultObjectionsContent };
