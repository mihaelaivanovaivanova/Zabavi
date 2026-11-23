import type { BoxNowSettings, BoxNowSettingsPublic } from "@/domain/settings/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";
import { decryptSecret, encryptSecret, isSecretConfigured } from "@/infrastructure/settings/encryption";

interface StoredPayload {
  enabled?: boolean;
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string | null;
  originLocationId?: string;
  originContactName?: string;
  originContactEmail?: string;
  originContactNumber?: string;
  partnerId?: string;
}

function envDefaults() {
  return {
    apiUrl: process.env.BOXNOW_API_URL ?? "",
    clientId: process.env.BOXNOW_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.BOXNOW_OAUTH_CLIENT_SECRET ?? "",
    originLocationId: process.env.BOXNOW_ORIGIN_LOCATION_ID ?? "",
    originContactName: process.env.BOXNOW_ORIGIN_CONTACT_NAME ?? "",
    originContactEmail: process.env.BOXNOW_ORIGIN_CONTACT_EMAIL ?? "",
    originContactNumber: process.env.BOXNOW_ORIGIN_CONTACT_NUMBER ?? "",
    partnerId: process.env.BOXNOW_PARTNER_ID ?? "",
  };
}

async function loadStored(): Promise<StoredPayload | null> {
  return (await settingsRepository.get("box_now")) as StoredPayload | null;
}

export async function getBoxNowSettings(): Promise<BoxNowSettings> {
  const stored = await loadStored();
  const envs = envDefaults();
  const storedClientSecret = stored?.clientSecret ? decryptSecret(stored.clientSecret) : null;

  return {
    enabled: stored?.enabled ?? true,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    clientId: stored?.clientId || envs.clientId,
    clientSecret: storedClientSecret || envs.clientSecret,
    originLocationId: stored?.originLocationId || envs.originLocationId,
    originContactName: stored?.originContactName || envs.originContactName,
    originContactEmail: stored?.originContactEmail || envs.originContactEmail,
    originContactNumber: stored?.originContactNumber || envs.originContactNumber,
    partnerId: stored?.partnerId || envs.partnerId,
  };
}

export async function isBoxNowConfigured(): Promise<boolean> {
  const settings = await getBoxNowSettings();
  return Boolean(
    settings.enabled &&
      settings.apiUrl &&
      settings.clientId &&
      settings.clientSecret &&
      settings.originLocationId &&
      settings.originContactName &&
      settings.originContactEmail &&
      settings.originContactNumber,
  );
}

export async function getBoxNowSettingsForAdmin(): Promise<BoxNowSettingsPublic> {
  const stored = await loadStored();
  const envs = envDefaults();
  return {
    enabled: stored?.enabled ?? true,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    clientId: stored?.clientId || envs.clientId,
    originLocationId: stored?.originLocationId || envs.originLocationId,
    originContactName: stored?.originContactName || envs.originContactName,
    originContactEmail: stored?.originContactEmail || envs.originContactEmail,
    originContactNumber: stored?.originContactNumber || envs.originContactNumber,
    partnerId: stored?.partnerId || envs.partnerId,
    clientSecretConfigured: isSecretConfigured(stored?.clientSecret) || Boolean(envs.clientSecret),
  };
}

export interface BoxNowSettingsUpdate {
  enabled: boolean;
  apiUrl: string;
  clientId: string;
  originLocationId: string;
  originContactName: string;
  originContactEmail: string;
  originContactNumber: string;
  partnerId: string;
  /** `undefined`/`""` keeps the currently stored secret. */
  clientSecret?: string;
}

export async function saveBoxNowSettings(update: BoxNowSettingsUpdate): Promise<void> {
  const stored = await loadStored();

  const payload: StoredPayload = {
    enabled: update.enabled,
    apiUrl: update.apiUrl,
    clientId: update.clientId,
    originLocationId: update.originLocationId,
    originContactName: update.originContactName,
    originContactEmail: update.originContactEmail,
    originContactNumber: update.originContactNumber,
    partnerId: update.partnerId,
    clientSecret: update.clientSecret ? encryptSecret(update.clientSecret) : (stored?.clientSecret ?? null),
  };

  await settingsRepository.save("box_now", payload as Record<string, unknown>);
}
