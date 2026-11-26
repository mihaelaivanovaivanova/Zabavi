"use client";

import { useBoxNowMarketingContent } from "@/lib/useBoxNowMarketingContent";

/**
 * Thin promo strip above the header, ported from smisul.bg's
 * TopAnnouncementBar.tsx (same green/cream BOX NOW brand colors, same
 * Montserrat 800-weight scrolling text, same placement — above the Header
 * on every page, see `layout.tsx`). Admin-configurable (visibility +
 * message) via the BOX NOW card in /admin/settings/shipping.
 */
export function TopAnnouncementBar() {
  const { content } = useBoxNowMarketingContent();

  if (!content.bannerEnabled) return null;

  return (
    <div
      className="overflow-hidden bg-[var(--color-boxnow-green)] px-0 py-2 text-sm font-extrabold tracking-wide text-[var(--color-boxnow-cream)]"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <div className="top-announcement-bar__track flex w-max items-center gap-2 whitespace-nowrap">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.75em] w-[1.75em] shrink-0 fill-current">
          <path d="M3 6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h1.17a2.5 2.5 0 0 0 4.66 0h6.34a2.5 2.5 0 0 0 4.66 0H21a1 1 0 0 0 1-1v-4.07a1 1 0 0 0-.2-.6l-2.87-3.83A1 1 0 0 0 18.13 7H16V7a1 1 0 0 0-1-1H3zm14 3h1.13l2.25 3H17V9zM7.5 16.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm11 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        </svg>
        <span>{content.bannerMessage}</span>
      </div>
    </div>
  );
}
