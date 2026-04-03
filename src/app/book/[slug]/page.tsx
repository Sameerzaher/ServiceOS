import { notFound } from "next/navigation";

import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { isPublicSupabaseEnvConfigured } from "@/lib/env/publicSupabaseEnv";

import { PublicBookingEnvMissing } from "./PublicBookingEnvMissing";
import { PublicBookingSlugClient } from "./PublicBookingSlugClient";

type PageProps = {
  /** Next 14: object. Next 15+: Promise — both supported. */
  params: Promise<{ slug: string }> | { slug: string };
};

/**
 * Server entry: validate slug + env before any client fetch.
 * Wrapped so missing/invalid `params` never becomes an unhandled 500.
 */
export default async function PublicBookingBySlugPage({ params }: PageProps) {
  try {
    const resolved = await Promise.resolve(params);
    const raw = resolved?.slug;
    const slug = typeof raw === "string" ? normalizeTeacherSlug(raw) : "";

    console.log("[book/slug page] [TEMP] normalized_slug=", JSON.stringify(slug));

    if (!slug || !isValidPublicTeacherSlug(slug)) {
      notFound();
    }

    if (!isPublicSupabaseEnvConfigured()) {
      console.error(
        "[BOOK_PAGE_ERROR]",
        new Error("server: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      );
      return <PublicBookingEnvMissing />;
    }

    return <PublicBookingSlugClient slug={slug} />;
  } catch (e) {
    console.error("[book/slug page] fatal — falling back to notFound", e);
    notFound();
  }
}
