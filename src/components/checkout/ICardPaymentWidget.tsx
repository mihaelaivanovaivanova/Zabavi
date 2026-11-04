"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";

const WIDGET_SCRIPT_SRC_BASE = "https://ipg.icard.com/js/payment-widget.js";
const WIDGET_SCRIPT_ID = "ipg-io-js";

/**
 * Embeds iCard's payment widget directly on the page (per the "IPG Payment
 * Widget" section of the IPG API manual) — no redirect to a hosted page.
 * The wrapper's id must be exactly "ipg": the widget script looks for it
 * globally, so only one instance can exist on the page at a time.
 */
export function ICardPaymentWidget({ token }: { token: string }) {
  useEffect(() => {
    document.getElementById(WIDGET_SCRIPT_ID)?.remove();

    const script = document.createElement("script");
    script.id = WIDGET_SCRIPT_ID;
    script.src = `${WIDGET_SCRIPT_SRC_BASE}?token=${encodeURIComponent(token)}`;
    document.body.appendChild(script);

    return () => {
      document.getElementById(WIDGET_SCRIPT_ID)?.remove();
    };
  }, [token]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink-800">Плащане с карта</span>
        <Badge tone="neutral">iCard</Badge>
      </div>
      <div id="ipg" style={{ minWidth: 320 }} />
    </div>
  );
}
