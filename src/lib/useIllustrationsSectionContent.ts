"use client";

import { useEffect, useState } from "react";
import { defaultIllustrationsSectionContent, type IllustrationsSectionContent } from "@/domain/content/types";

/** Client-side fetch of the admin-editable copy for the landing page's "Четирите илюстрации" section (see /api/content/illustrations-section). */
export function useIllustrationsSectionContent(): { content: IllustrationsSectionContent; isLoading: boolean } {
  const [content, setContent] = useState<IllustrationsSectionContent>(defaultIllustrationsSectionContent());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/illustrations-section")
      .then((response) => response.json())
      .then((data: { content?: IllustrationsSectionContent }) => {
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
