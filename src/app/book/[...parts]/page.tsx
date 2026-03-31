"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy / malformed booking links sometimes include extra path segments
 * (e.g. `/book/<slug>/<something>`). We normalize to `/book/<slug>`.
 */
export default function BookCatchAllRedirectPage({
  params,
}: {
  params: { parts?: string[] };
}) {
  const router = useRouter();
  const slug = Array.isArray(params.parts) && params.parts.length > 0 ? params.parts[0] : "";

  useEffect(() => {
    if (!slug) {
      router.replace("/book");
      return;
    }
    router.replace(`/book/${encodeURIComponent(slug)}`);
  }, [router, slug]);

  return null;
}

