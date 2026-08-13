"use client";

import { useEffect, useRef } from "react";

/**
 * Records that this member opened this article.
 *
 * A client component rather than a write during server render, for two
 * reasons. A server component that writes on render also writes when Next
 * prefetches or revalidates the page, which would count reads nobody made. And
 * a fetch from the browser is the only signal that a person, rather than a
 * crawler or a warm-up request, actually has the article on screen.
 *
 * It fires once and reports nothing. Everything that decides whether the read
 * counts, including the half-hour window and the author reading their own
 * piece, lives in migration 0023 where no caller can get it wrong.
 */
export function RecordRead({ articleId }: { articleId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    // React runs effects twice in development. The database would treat the
    // second one as the same read anyway, but there is no reason to send it.
    if (sent.current) return;
    sent.current = true;

    // Deliberately unawaited and deliberately silent. A read is telemetry, and
    // telemetry that can interrupt somebody reading is worse than telemetry
    // that is occasionally missing.
    void fetch(`/api/articles/${articleId}/read`, { method: "POST" }).catch(() => {});
  }, [articleId]);

  return null;
}
