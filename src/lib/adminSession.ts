/**
 * Signed, stateless admin session tokens. Credentials and the signing
 * secret only ever come from env vars — if they're missing, admin access
 * is disabled, never silently defaulted.
 */
import { createSignedToken, verifySignedToken } from "@/lib/hmac";

export const ADMIN_SESSION_COOKIE = "zabavi_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

interface SessionPayload {
  u: string;
  exp: number;
}

/** Throws when ADMIN_SESSION_SECRET is not configured — callers decide how to surface that. */
function requireSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set — admin login is disabled until it is configured.");
  }
  return secret;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export async function createAdminSessionToken(username: string): Promise<string> {
  const secret = requireSessionSecret();
  const payload: SessionPayload = { u: username, exp: Date.now() + SESSION_TTL_MS };
  return createSignedToken(secret, payload);
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  let secret: string;
  try {
    secret = requireSessionSecret();
  } catch {
    return false;
  }

  const payload = await verifySignedToken<SessionPayload>(secret, token);
  return typeof payload?.exp === "number" && payload.exp > Date.now();
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
