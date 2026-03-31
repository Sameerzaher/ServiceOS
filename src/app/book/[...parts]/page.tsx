import { redirect } from "next/navigation";

/**
 * Legacy / malformed booking links sometimes include extra path segments
 * (e.g. `/book/<slug>/<something>`). We normalize to `/book/<slug>`.
 */
export default function BookCatchAllRedirectPage({
  params,
}: {
  params: { parts?: string[] };
}) {
  const slug =
    Array.isArray(params.parts) && params.parts.length > 0 ? params.parts[0] : "";

  if (!slug) {
    redirect("/book");
  }

  redirect(`/book/${encodeURIComponent(slug)}`);
}

