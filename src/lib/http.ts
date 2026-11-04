/**
 * Best-effort client IP extraction from proxy headers (Railway/Vercel set
 * `x-forwarded-for`). Never trust this for security decisions — only used
 * here because iCard's IPGPurchase requires a CustomerIP field.
 */
export function getClientIp(request: Request): string | undefined {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? undefined;
}
