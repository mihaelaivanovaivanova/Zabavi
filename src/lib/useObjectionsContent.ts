"use client";

import { useEffect, useState } from "react";
import { defaultObjectionsContent, type ObjectionsContent } from "@/domain/content/types";

/** Client-side fetch of the admin-editable "Ами ако…" items (see /api/content/objections). */
export function useObjectionsContent(): { content: ObjectionsContent; isLoading: boolean } {
  const [content, setContent] = useState<ObjectionsContent>(defaultObjectionsContent());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/objections")
      .then((response) => response.json())
      .then((data: { content?: ObjectionsContent }) => {
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
