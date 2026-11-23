import type { ICardSettings, ICardSettingsPublic } from "@/domain/settings/types";
import { settingsRepository } from "@/infrastructure/settings/settingsRepository";
import { decryptSecret, encryptSecret, isSecretConfigured } from "@/infrastructure/settings/encryption";

interface StoredPayload {
  enabled?: boolean;
  apiUrl?: string;
  originator?: string;
  mid?: string;
  midName?: string;
  keyIndex?: string;
  ipgVersion?: string;
  language?: string;
  privateKey?: string | null;
  icardPublicKey?: string | null;
}

/**
 * Env vars remain the fallback for local/demo use without a database (see
 * `.env.example`) — a saved admin setting always wins once present, same
 * precedence as `kitRepository`'s Postgres-over-in-memory choice.
 */
function envDefaults() {
  return {
    apiUrl: process.env.ICARD_API_URL || "https://ipay.bg/paymentpage",
    originator: process.env.ICARD_ORIGINATOR ?? "",
    mid: process.env.ICARD_MID ?? "",
    midName: process.env.ICARD_MID_NAME ?? "",
    keyIndex: process.env.ICARD_KEY_INDEX || "1",
    ipgVersion: process.env.ICARD_IPG_VERSION || "3.3",
    language: process.env.ICARD_LANGUAGE || "BG",
    privateKey: process.env.ICARD_PRIVATE_KEY ?? "",
    icardPublicKey: process.env.ICARD_IPG_PUBLIC_KEY ?? "",
  };
}

async function loadStored(): Promise<StoredPayload | null> {
  return (await settingsRepository.get("icard")) as StoredPayload | null;
}

/** Full settings for server-side use (e.g. signing requests) — includes plaintext secrets. */
export async function getICardSettings(): Promise<ICardSettings> {
  const stored = await loadStored();
  const envs = envDefaults();
  const storedPrivateKey = stored?.privateKey ? decryptSecret(stored.privateKey) : null;
  const storedPublicKey = stored?.icardPublicKey ? decryptSecret(stored.icardPublicKey) : null;

  return {
    enabled: stored?.enabled ?? true,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    originator: stored?.originator || envs.originator,
    mid: stored?.mid || envs.mid,
    midName: stored?.midName || envs.midName,
    keyIndex: stored?.keyIndex || envs.keyIndex,
    ipgVersion: stored?.ipgVersion || envs.ipgVersion,
    language: stored?.language || envs.language,
    privateKey: storedPrivateKey || envs.privateKey,
    icardPublicKey: storedPublicKey || envs.icardPublicKey,
  };
}

export async function isICardConfigured(): Promise<boolean> {
  const settings = await getICardSettings();
  return Boolean(
    settings.enabled &&
      settings.originator &&
      settings.mid &&
      settings.midName &&
      settings.privateKey &&
      settings.icardPublicKey,
  );
}

export async function getICardSettingsForAdmin(): Promise<ICardSettingsPublic> {
  const stored = await loadStored();
  const envs = envDefaults();
  return {
    enabled: stored?.enabled ?? true,
    apiUrl: stored?.apiUrl || envs.apiUrl,
    originator: stored?.originator || envs.originator,
    mid: stored?.mid || envs.mid,
    midName: stored?.midName || envs.midName,
    keyIndex: stored?.keyIndex || envs.keyIndex,
    ipgVersion: stored?.ipgVersion || envs.ipgVersion,
    language: stored?.language || envs.language,
    privateKeyConfigured: isSecretConfigured(stored?.privateKey) || Boolean(envs.privateKey),
    icardPublicKeyConfigured: isSecretConfigured(stored?.icardPublicKey) || Boolean(envs.icardPublicKey),
  };
}

export interface ICardSettingsUpdate {
  enabled: boolean;
  apiUrl: string;
  originator: string;
  mid: string;
  midName: string;
  keyIndex: string;
  ipgVersion: string;
  language: string;
  /** `undefined`/`""` keeps the currently stored key — mirrors the admin UI's "leave blank to keep current value". */
  privateKey?: string;
  icardPublicKey?: string;
}

export async function saveICardSettings(update: ICardSettingsUpdate): Promise<void> {
  const stored = await loadStored();

  const payload: StoredPayload = {
    enabled: update.enabled,
    apiUrl: update.apiUrl,
    originator: update.originator,
    mid: update.mid,
    midName: update.midName,
    keyIndex: update.keyIndex,
    ipgVersion: update.ipgVersion,
    language: update.language,
    privateKey: update.privateKey ? encryptSecret(update.privateKey) : (stored?.privateKey ?? null),
    icardPublicKey: update.icardPublicKey ? encryptSecret(update.icardPublicKey) : (stored?.icardPublicKey ?? null),
  };

  await settingsRepository.save("icard", payload as Record<string, unknown>);
}
