import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { isPublicSupabaseEnvConfigured } from "@/lib/env/publicSupabaseEnv";

import { PublicBookingEnvMissing } from "./PublicBookingEnvMissing";

const PublicBookingSlugClient = dynamic(
  () => import("./PublicBookingSlugClient"),
  { ssr: true },
);

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

/**
 * No try/catch around `notFound()` — catching can interfere with NEXT_NOT_FOUND.
 * Client tree via `dynamic()` for a stable production client-reference boundary.
 */
export default async function PublicBookingBySlugPage({ params }: PageProps) {
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
}
