import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { isPublicSupabaseEnvConfigured } from "@/lib/env/publicSupabaseEnv";

import { PublicBookingEnvMissing } from "./PublicBookingEnvMissing";

/**
 * Client tree loaded via `next/dynamic` so the server page has a single, explicit
 * async client boundary (avoids fragile `clientModules` resolution in production).
 */
const PublicBookingSlugClient = dynamic(
  () => import("./PublicBookingSlugClient"),
  { ssr: true },
);

type PageProps = {
  /** Next 14: object. Next 15+: Promise — both supported. */
  params: Promise<{ slug: string }> | { slug: string };
};

/**
 * Server entry: validate slug + env, then one dynamic client boundary.
 *
 * DEBUG bisection (if this route still crashes): temporarily replace the body with:
 *   return <div>BOOK PAGE OK</div>;
 * then add back `PublicBookingEnvMissing` only, then restore this file.
 */
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
