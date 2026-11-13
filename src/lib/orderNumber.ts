import { randomBytes } from "node:crypto";

/** Short, human-readable order reference shown in the admin dashboard, e.g. "ZB-261113-A4F2". */
export function generateOrderNumber(createdAt: Date): string {
  const ymd = createdAt.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `ZB-${ymd}-${suffix}`;
}
