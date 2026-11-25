/**
 * Shared signed-token primitives (HMAC-SHA256 via Web Crypto, so the same
 * code runs in both Node route handlers and the Edge middleware). Used by
 * both the admin session cookie (`adminSession.ts`) and the review
 * confirmation link (`reviewConfirmationToken.ts`) — one signing scheme,
 * two different secrets and payload shapes.
 */

export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(signature);
}

export async function createSignedToken<T extends object>(secret: string, payload: T): Promise<string> {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSign(secret, payloadB64);
  return `${payloadB64}.${signature}`;
}

/** Verifies the signature only — callers still own checking any `exp`/other claims in the returned payload. */
export async function verifySignedToken<T>(secret: string, token: string): Promise<T | null> {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = await hmacSign(secret, payloadB64);
  if (expectedSignature !== signature) return null;

  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as T;
  } catch {
    return null;
  }
}
