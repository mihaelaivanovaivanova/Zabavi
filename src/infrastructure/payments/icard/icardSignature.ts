import { createHash, createSign, createVerify } from "node:crypto";

/**
 * Replicates PHP's `urlencode()` exactly (RFC 1738 style): spaces become
 * `+`, and only `A-Z a-z 0-9 - _ .` are left unescaped — unlike
 * `encodeURIComponent`, which also leaves `! ~ * ' ( )` unescaped. iCard's
 * signing example is PHP-specific (`urlencode(stripslashes(...))`), so the
 * encoding must match byte-for-byte or signatures won't verify.
 */
export function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * iCard's signing mechanism (IPG API manual, "Signatures" section): take
 * all property VALUES in transmission order (excluding `Signature` itself),
 * concatenate with no separator, URL-encode the whole string, SHA1 it, then
 * RSA-sign the SHA1 hex digest. The result is base64-encoded and sent as
 * the `Signature` property, always last.
 */
function sha1HexOfConcatenatedValues(orderedPairs: [string, string][]): string {
  const concatenated = orderedPairs.map(([, value]) => value).join("");
  const urlEncoded = phpUrlEncode(concatenated);
  return createHash("sha1").update(urlEncoded, "utf8").digest("hex");
}

export function signIcardFields(orderedPairs: [string, string][], privateKeyPem: string): string {
  const sha1Hex = sha1HexOfConcatenatedValues(orderedPairs);
  const signer = createSign("RSA-SHA1");
  signer.update(sha1Hex, "utf8");
  return signer.sign(privateKeyPem, "base64");
}

export function verifyIcardFields(
  orderedPairs: [string, string][],
  signatureBase64: string,
  publicKeyPem: string,
): boolean {
  try {
    const sha1Hex = sha1HexOfConcatenatedValues(orderedPairs);
    const verifier = createVerify("RSA-SHA1");
    verifier.update(sha1Hex, "utf8");
    return verifier.verify(publicKeyPem, signatureBase64, "base64");
  } catch {
    return false;
  }
}

/**
 * Parses an `application/x-www-form-urlencoded` body into ordered
 * key/value pairs, preserving the order fields appear in — required
 * because the signature hash depends on transmission order, not key names.
 */
export function parseFormUrlEncodedOrdered(raw: string): [string, string][] {
  if (!raw) return [];
  return raw
    .split("&")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const eqIndex = pair.indexOf("=");
      const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
      const rawValue = eqIndex === -1 ? "" : pair.slice(eqIndex + 1);
      const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
      const value = decodeURIComponent(rawValue.replace(/\+/g, " "));
      return [key, value] as [string, string];
    });
}
