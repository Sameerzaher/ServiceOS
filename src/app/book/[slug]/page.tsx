import { notFound } from "next/navigation";

import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { isPublicSupabaseEnvConfigured } from "@/lib/env/publicSupabaseEnv";

import { PublicBookingEnvMissing } from "./PublicBookingEnvMissing";
import PublicBookingSlugClient from "./PublicBookingSlugClient";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function PublicBookingBySlugPage({ params }: PageProps) {
  try {
    const resolved = await Promise.resolve(params);
    const raw = resolved?.slug;
    const slug = typeof raw === "string" ? normalizeTeacherSlug(raw) : "";

    if (!slug || !isValidPublicTeacherSlug(slug)) {
      notFound();
    }

    if (!isPublicSupabaseEnvConfigured()) {
      return <PublicBookingEnvMissing />;
    }

    return <PublicBookingSlugClient slug={slug} />;
  } catch (e) {
    console.error("[book/slug page] fatal — notFound", e);
    notFound();
  }
}
