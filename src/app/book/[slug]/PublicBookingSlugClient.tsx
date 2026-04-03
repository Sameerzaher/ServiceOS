"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";

import { heUi } from "@/config";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import { Button, Spinner, ui } from "@/components/ui";
import {
  PublicBookingPageContent,
  type PublicBookingIdentity,
} from "@/features/booking/components/PublicBookingPageContent";
import {
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";
import { isPublicSupabaseEnvConfigured } from "@/lib/env/publicSupabaseEnv";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      teacherId: string;
      businessType: BusinessType;
      identity: PublicBookingIdentity;
      availability: AvailabilitySettings;
    };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function safeTeacherPayload(
  raw: unknown,
): { id: string; businessType: unknown; businessName?: unknown; fullName?: unknown; phone?: unknown } | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;
  return {
    id,
    businessType: raw.businessType,
    businessName: raw.businessName,
    fullName: raw.fullName,
    phone: raw.phone,
  };
}

export function PublicBookingSlugClient({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    const trimmed = typeof slug === "string" ? slug.trim() : "";
    console.log("[PublicBooking DEBUG] bootstrap start", { slug: trimmed });

    if (!trimmed) {
      console.error("[BOOK_PAGE_ERROR]", new Error("empty_slug_prop"));
      notFound();
      return;
    }

    if (!isPublicSupabaseEnvConfigured()) {
      console.error("[BOOK_PAGE_ERROR]", new Error("missing_public_supabase_env"));
      setState({
        kind: "error",
        message: heUi.publicBooking.errUnavailable,
      });
      return;
    }

    setState({ kind: "loading" });

    try {
      const url = `/api/public-booking/bootstrap?slug=${encodeURIComponent(trimmed)}`;
      console.log("[PublicBooking DEBUG] fetch", { url });

      let res: Response;
      try {
        res = await fetch(url);
      } catch (networkErr) {
        console.error("[BOOK_PAGE_ERROR]", networkErr);
        setState({
          kind: "error",
          message: heUi.publicBooking.errNetwork,
        });
        return;
      }

      let raw: unknown;
      try {
        raw = await res.json();
      } catch (parseErr) {
        console.error("[BOOK_PAGE_ERROR]", parseErr);
        setState({
          kind: "error",
          message:
            res.status === 503 || res.status === 502
              ? heUi.publicBooking.errUnavailable
              : heUi.publicBooking.bootstrapLoadFailedTitle,
        });
        return;
      }

      console.log("[PublicBooking DEBUG] bootstrap response", {
        status: res.status,
        ok: res.ok,
        hasTeacher: isRecord(raw) && raw.ok === true && isRecord(raw.teacher),
        keys: isRecord(raw) ? Object.keys(raw) : [],
      });

      if (res.status === 404) {
        console.log("[PublicBooking DEBUG] notFound branch (404)");
        notFound();
        return;
      }

      if (!isRecord(raw)) {
        console.error("[BOOK_PAGE_ERROR]", new Error("bootstrap_not_object"));
        setState({
          kind: "error",
          message: heUi.publicBooking.bootstrapLoadFailedTitle,
        });
        return;
      }

      if (raw.ok !== true) {
        const errMsg =
          typeof raw.error === "string" && raw.error.length > 0
            ? raw.error
            : heUi.publicBooking.bootstrapLoadFailedTitle;
        if (res.status === 503 || res.status === 502) {
          setState({ kind: "error", message: heUi.publicBooking.errUnavailable });
        } else {
          setState({ kind: "error", message: errMsg });
        }
        return;
      }

      const teacherRaw = raw.teacher;
      const teacher = safeTeacherPayload(teacherRaw);
      if (!teacher) {
        console.error("[BOOK_PAGE_ERROR]", new Error("bootstrap_teacher_invalid"));
        notFound();
        return;
      }

      const availabilityRaw = raw.availability;
      const availabilityPayload =
        isRecord(availabilityRaw) ? availabilityRaw : {};
      const availability = normalizeAvailabilitySettings({
        ...availabilityPayload,
        teacherId: teacher.id,
      });

      const businessType = coerceBusinessType(teacher.businessType);

      const identity: PublicBookingIdentity = {
        businessName:
          typeof teacher.businessName === "string" ? teacher.businessName : "",
        teacherName: typeof teacher.fullName === "string" ? teacher.fullName : "",
        phone: typeof teacher.phone === "string" ? teacher.phone : "",
      };

      console.log("[PublicBooking DEBUG] ready", {
        teacherId: teacher.id,
        businessType,
        bookingEnabled: availability.bookingEnabled,
      });

      setState({
        kind: "ready",
        teacherId: teacher.id,
        businessType,
        identity,
        availability,
      });
    } catch (e) {
      console.error("[BOOK_PAGE_ERROR]", e);
      setState({
        kind: "error",
        message: heUi.publicBooking.bootstrapLoadFailedTitle,
      });
    }
  }, [slug]);

  useEffect(() => {
    void load().catch((e) => {
      console.error("[BOOK_PAGE_ERROR]", e);
      setState({
        kind: "error",
        message: heUi.publicBooking.bootstrapLoadFailedTitle,
      });
    });
  }, [load]);

  if (state.kind === "loading") {
    return (
      <main className={ui.pageMain}>
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-neutral-600"
          role="status"
          aria-live="polite"
        >
          <Spinner className="size-8 border-neutral-300 border-t-neutral-700" />
          <span className="sr-only">{heUi.loading.ariaBusy}</span>
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className={ui.pageMain}>
        <header className={ui.header}>
          <h1 className={ui.pageTitle}>{heUi.publicBooking.invalidSlugTitle}</h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
            {state.message}
          </p>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
            {heUi.publicBooking.invalidSlugDescription}
          </p>
          <div className="mt-6">
            <Button type="button" variant="secondary" onClick={() => void load()}>
              {heUi.errors.tryAgain}
            </Button>
          </div>
        </header>
      </main>
    );
  }

  const tid = state.teacherId.trim();
  if (!tid) {
    console.error("[BOOK_PAGE_ERROR]", new Error("ready_state_missing_teacherId"));
    notFound();
    return null;
  }

  return (
    <PublicBookingPageContent
      teacherId={tid}
      businessType={state.businessType}
      identity={state.identity}
      availability={state.availability}
    />
  );
}
