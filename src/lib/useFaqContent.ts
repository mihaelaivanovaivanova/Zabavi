"use client";

import { useEffect, useState } from "react";
import { defaultFaqContent, type FaqContent } from "@/domain/content/types";

/** Client-side fetch of the admin-editable FAQ items (see /api/content/faq). */
export function useFaqContent(): { content: FaqContent; isLoading: boolean } {
  const [content, setContent] = useState<FaqContent>(defaultFaqContent());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/faq")
      .then((response) => response.json())
      .then((data: { content?: FaqContent }) => {
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
