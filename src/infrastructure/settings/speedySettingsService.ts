import type { SpeedySettings, SpeedySettingsPublic } from "@/domain/settings/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";
import { decryptSecret, encryptSecret, isSecretConfigured } from "@/infrastructure/settings/encryption";

/**
 * Credentials + account config for the real Speedy Web API client — see
 * `speedyApiClient.ts` and the `SpeedySettings` doc comment in
 * `@/domain/settings/types`. `enabled` still defaults to `false` (unlike
 * BOX NOW's `true`): going live on a courier order is an explicit admin
 * opt-in, either via the "Активно" checkbox or `SPEEDY_ENABLED=true`.
 */

interface StoredPayload {
  enabled?: boolean;
  apiUrl?: string;
  username?: string;
  password?: string | null;
  dropoffOfficeId?: string;
  serviceId?: string;
}

function envDefaults() {
  return {
    enabled: process.env.SPEEDY_ENABLED === "true",
    apiUrl: process.env.SPEEDY_API_URL ?? "",
    username: process.env.SPEEDY_USERNAME ?? "",
    password: process.env.SPEEDY_PASSWORD ?? "",
    dropoffOfficeId: process.env.SPEEDY_DROPOFF_OFFICE_ID ?? "",
    serviceId: process.env.SPEEDY_SERVICE_ID ?? "505",
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
    enabled: stored?.enabled ?? envs.enabled,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    username: stored?.username || envs.username,
    password: storedPassword || envs.password,
    dropoffOfficeId: stored?.dropoffOfficeId || envs.dropoffOfficeId,
    serviceId: stored?.serviceId || envs.serviceId,
  };
}

export async function isSpeedyConfigured(): Promise<boolean> {
  const settings = await getSpeedySettings();
  return Boolean(
    settings.enabled && settings.apiUrl && settings.username && settings.password && settings.dropoffOfficeId,
  );
}

export async function getSpeedySettingsForAdmin(): Promise<SpeedySettingsPublic> {
  const stored = await loadStored();
  const envs = envDefaults();
  return {
    enabled: stored?.enabled ?? envs.enabled,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    username: stored?.username || envs.username,
    dropoffOfficeId: stored?.dropoffOfficeId || envs.dropoffOfficeId,
    serviceId: stored?.serviceId || envs.serviceId,
    passwordConfigured: isSecretConfigured(stored?.password) || Boolean(envs.password),
  };
}

export interface SpeedySettingsUpdate {
  enabled: boolean;
  apiUrl: string;
  username: string;
  dropoffOfficeId: string;
  serviceId: string;
  /** `undefined`/`""` keeps the currently stored secret. */
  password?: string;
}

export async function saveSpeedySettings(update: SpeedySettingsUpdate): Promise<void> {
  const stored = await loadStored();

  const payload: StoredPayload = {
    enabled: update.enabled,
    apiUrl: update.apiUrl,
    username: update.username,
    dropoffOfficeId: update.dropoffOfficeId,
    serviceId: update.serviceId,
    password: update.password ? encryptSecret(update.password) : (stored?.password ?? null),
  };

  await settingsRepository.save("speedy", payload as Record<string, unknown>);
}
