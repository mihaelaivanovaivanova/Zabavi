"use client";

import { useEffect, useState } from "react";
import { defaultBoxNowMarketingContent, type BoxNowMarketingContent } from "@/domain/content/types";

/** Client-side fetch of the admin-editable BOX NOW marketing chrome (see /api/content/box-now-marketing). */
export function useBoxNowMarketingContent(): { content: BoxNowMarketingContent; isLoading: boolean } {
  const [content, setContent] = useState<BoxNowMarketingContent>(defaultBoxNowMarketingContent());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/box-now-marketing")
      .then((response) => response.json())
      .then((data: { content?: BoxNowMarketingContent }) => {
        if (!cancelled && data.content) setContent(data.content);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, isLoading };
}
