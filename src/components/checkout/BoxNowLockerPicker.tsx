"use client";

import { useEffect, useId } from "react";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";

const WIDGET_SCRIPT_SRC = "https://widget-cdn.boxnow.bg/map-widget/client/v5.js";

interface BoxNowWidgetSelection {
  boxnowLockerId: string;
  boxnowLockerAddressLine1: string;
  boxnowLockerPostalCode: string;
}

interface BoxNowWidgetConfig {
  parentElement: string;
  buttonSelector: string;
  afterSelect: (selected: BoxNowWidgetSelection) => void;
  partnerId?: number;
}

declare global {
  interface Window {
    _bn_map_widget_config?: BoxNowWidgetConfig;
  }
}

export interface BoxNowSelection {
  lockerId: string;
  addressLine1: string;
  postalCode: string;
}

interface BoxNowLockerPickerProps {
  selected: BoxNowSelection | null;
  onSelect: (selection: BoxNowSelection) => void;
  error?: string;
}

/**
 * Embeds BOX NOW's official public map widget so the customer can pick a
 * real locker. The widget talks directly to BOX NOW's production location
 * data and needs no partner credentials — only the (future) shipment
 * creation call needs those. See docs: widget-v5.boxnow.bg/developers.
 */
export function BoxNowLockerPicker({ selected, onSelect, error }: BoxNowLockerPickerProps) {
  const rawId = useId();
  const containerId = `boxnow-map-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const buttonClass = `boxnow-widget-button-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    window._bn_map_widget_config = {
      parentElement: `#${containerId}`,
      buttonSelector: `.${buttonClass}`,
      partnerId: siteConfig.integrations.boxNow.partnerId,
      afterSelect: (sel) => {
        onSelect({
          lockerId: sel.boxnowLockerId,
          addressLine1: sel.boxnowLockerAddressLine1,
          postalCode: sel.boxnowLockerPostalCode,
        });
      },
    };

    if (!document.querySelector(`script[src="${WIDGET_SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [containerId, buttonClass, onSelect]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink-800">Автомат BOX NOW</span>
        <Badge tone="neutral">Реална карта</Badge>
      </div>
      <div id={containerId} />
      <button
        type="button"
        className={`${buttonClass} inline-flex items-center justify-center rounded-full border border-lavender-300 bg-paper-50 px-5 py-2.5 text-sm font-medium text-burgundy-700 hover:bg-lavender-50`}
      >
        {selected ? "Смени автомата" : "Избери автомат на картата"}
      </button>
      {selected ? (
        <p className="text-sm text-ink-700">
          Избран автомат: {selected.addressLine1}, {selected.postalCode}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
