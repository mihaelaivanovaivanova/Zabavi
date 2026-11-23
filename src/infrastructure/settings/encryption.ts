import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * At-rest encryption for integration secrets (iCard RSA keys, BOX NOW/Speedy
 * credentials) stored in the `integration_settings` table — mirrors the
 * smisul.bg backend's `encrypted` Eloquent cast, just implemented with Node's
 * own crypto instead of Laravel's. AES-256-GCM; the key is derived once from
 * `SETTINGS_ENCRYPTION_KEY` via scrypt so the env var itself can be any
 * passphrase, not necessarily 32 raw bytes.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const ENC_PREFIX = "enc:v1:";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is not set — integration settings cannot be saved until it is configured.",
    );
  }
  cachedKey = scryptSync(secret, "zabavi-integration-settings", 32);
  return cachedKey;
}

/** `null`/`""` pass through unchanged — there is nothing meaningful to encrypt. */
export function encryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** Returns `null` for anything that isn't a value this module encrypted. */
export function decryptSecret(value: string | null | undefined): string | null {
  if (!value || !value.startsWith(ENC_PREFIX)) return null;
  const key = getKey();
  const raw = Buffer.from(value.slice(ENC_PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = raw.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function isSecretConfigured(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(ENC_PREFIX));
}
