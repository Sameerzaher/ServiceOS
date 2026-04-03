import { notFound } from "next/navigation";

import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { isPublicSupabaseEnvConfigured } from "@/lib/env/publicSupabaseEnv";

import { PublicBookingEnvMissing } from "./PublicBookingEnvMissing";
import { PublicBookingSlugClient } from "./PublicBookingSlugClient";

type PageProps = {
  params: { slug: string };
};

/**
 * Server entry: validate slug + env before any client fetch — avoids 500s from invalid routes
 * and surfaces misconfiguration without throwing. Do not wrap `notFound()` in try/catch (it throws).
 */
export default function PublicBookingBySlugPage({ params }: PageProps) {
  const raw = params?.slug;
  const slug = typeof raw === "string" ? normalizeTeacherSlug(raw) : "";

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
}
