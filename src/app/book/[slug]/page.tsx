"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { heUi } from "@/config";
import { Button, Spinner, ui } from "@/components/ui";
import {
  PublicBookingPageContent,
  type PublicBookingIdentity,
} from "@/features/booking/components/PublicBookingPageContent";
import {
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      teacherId: string;
      identity: PublicBookingIdentity;
      availability: AvailabilitySettings;
    };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export default function PublicBookingBySlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    if (!slug) {
      setState({
        kind: "error",
        message: heUi.publicBooking.invalidSlugMessage,
      });
      return;
    }
    setState({ kind: "loading" });
    try {
      const res = await fetch(
        `/api/public-booking/bootstrap?slug=${encodeURIComponent(slug)}`,
      );
      const raw: unknown = await res.json();

      if (
        !isRecord(raw) ||
        raw.ok !== true ||
        !isRecord(raw.teacher) ||
        typeof raw.teacher.id !== "string"
      ) {
        const msg =
          isRecord(raw) && typeof raw.error === "string" && raw.error.length > 0
            ? raw.error
            : heUi.publicBooking.invalidSlugMessage;
        setState({ kind: "error", message: msg });
        return;
      }

      const t = raw.teacher as Record<string, unknown>;
      const teacherId = t.id as string;
      const identity: PublicBookingIdentity = {
        businessName: typeof t.businessName === "string" ? t.businessName : "",
        teacherName: typeof t.fullName === "string" ? t.fullName : "",
        phone: typeof t.phone === "string" ? t.phone : "",
      };

      const availability = normalizeAvailabilitySettings(raw.availability);

      setState({
        kind: "ready",
        teacherId,
        identity,
        availability,
      });
    } catch {
      setState({
        kind: "error",
        message: heUi.publicBooking.bootstrapLoadFailedTitle,
      });
    }
  }, [slug]);

  useEffect(() => {
    void load();
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

  return (
    <PublicBookingPageContent
      teacherId={state.teacherId}
      identity={state.identity}
      availability={state.availability}
    />
  );
}
