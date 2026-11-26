"use client";

import { useEffect, useState } from "react";
import { defaultHowItWorksContent, type HowItWorksContent } from "@/domain/content/types";

/** Client-side fetch of the admin-editable copy for the landing page's "Как протича рисуването" section (see /api/content/how-it-works). */
export function useHowItWorksContent(): { content: HowItWorksContent; isLoading: boolean } {
  const [content, setContent] = useState<HowItWorksContent>(defaultHowItWorksContent());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/how-it-works")
      .then((response) => response.json())
      .then((data: { content?: HowItWorksContent }) => {
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
