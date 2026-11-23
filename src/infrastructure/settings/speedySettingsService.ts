import type { SpeedySettings, SpeedySettingsPublic } from "@/domain/settings/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";
import { decryptSecret, encryptSecret, isSecretConfigured } from "@/infrastructure/settings/encryption";

/**
 * Credentials storage only — see the `SpeedySettings` doc comment in
 * `@/domain/settings/types`. Nothing in `courierProvider.ts` reads this yet.
 */

interface StoredPayload {
  enabled?: boolean;
  apiUrl?: string;
  username?: string;
  password?: string | null;
}

function envDefaults() {
  return {
    apiUrl: process.env.SPEEDY_API_URL ?? "",
    username: process.env.SPEEDY_USERNAME ?? "",
    password: process.env.SPEEDY_PASSWORD ?? "",
  };
}

async function loadStored(): Promise<StoredPayload | null> {
  return (await settingsRepository.get("speedy")) as StoredPayload | null;
}

export async function getSpeedySettings(): Promise<SpeedySettings> {
  const stored = await loadStored();
  const envs = envDefaults();
  const storedPassword = stored?.password ? decryptSecret(stored.password) : null;

  return {
    enabled: stored?.enabled ?? false,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    username: stored?.username || envs.username,
    password: storedPassword || envs.password,
  };
}

export async function getSpeedySettingsForAdmin(): Promise<SpeedySettingsPublic> {
  const stored = await loadStored();
  const envs = envDefaults();
  return {
    enabled: stored?.enabled ?? false,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    username: stored?.username || envs.username,
    passwordConfigured: isSecretConfigured(stored?.password) || Boolean(envs.password),
  };
}

export interface SpeedySettingsUpdate {
  enabled: boolean;
  apiUrl: string;
  username: string;
  /** `undefined`/`""` keeps the currently stored secret. */
  password?: string;
}

export async function saveSpeedySettings(update: SpeedySettingsUpdate): Promise<void> {
  const stored = await loadStored();

  const payload: StoredPayload = {
    enabled: update.enabled,
    apiUrl: update.apiUrl,
    username: update.username,
    password: update.password ? encryptSecret(update.password) : (stored?.password ?? null),
  };

  await settingsRepository.save("speedy", payload as Record<string, unknown>);
}
