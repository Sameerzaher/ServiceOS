"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

function slugFromParams(slugParam: string | string[] | undefined): string {
  if (typeof slugParam === "string") return slugParam.trim();
  if (Array.isArray(slugParam) && slugParam.length > 0) {
    return String(slugParam[0] ?? "").trim();
  }
  return "";
}

export default function PublicBookingBySlugPage() {
  const params = useParams();
  const slug = slugFromParams(
    params.slug as string | string[] | undefined,
  );
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    console.log("[PublicBooking] Loading booking page for slug:", slug);
    
    if (!slug) {
      console.error("[PublicBooking] No slug provided");
      setState({
        kind: "error",
        message: heUi.publicBooking.invalidSlugMessage,
      });
      return;
    }
    setState({ kind: "loading" });
    try {
      const url = `/api/public-booking/bootstrap?slug=${encodeURIComponent(slug)}`;
      console.log("[PublicBooking] Fetching:", url);
      
      const res = await fetch(url);
      let raw: unknown;
      try {
        raw = await res.json();
      } catch {
        console.error(
          "[PublicBooking] Bootstrap response not JSON",
          res.status,
        );
        setState({
          kind: "error",
          message:
            res.status === 503 || res.status === 502
              ? heUi.publicBooking.errUnavailable
              : heUi.publicBooking.bootstrapLoadFailedTitle,
        });
        return;
      }

      console.log("[PublicBooking] Bootstrap response:", {
        status: res.status,
        ok: res.ok,
        data: raw,
      });

      if (res.status === 404) {
        setState({
          kind: "error",
          message: heUi.publicBooking.invalidSlugMessage,
        });
        return;
      }

      if (
        !isRecord(raw) ||
        raw.ok !== true ||
        !isRecord(raw.teacher) ||
        typeof raw.teacher.id !== "string"
      ) {
        let msg: string = heUi.publicBooking.invalidSlugMessage;
        if (isRecord(raw) && typeof raw.error === "string" && raw.error.length > 0) {
          msg = raw.error;
        } else if (!res.ok && (res.status === 503 || res.status === 502)) {
          msg = heUi.publicBooking.errUnavailable;
        } else if (!res.ok) {
          msg = heUi.publicBooking.bootstrapLoadFailedTitle;
        }
        console.error("[PublicBooking] Step=bootstrap_not_ok", msg, res.status);
        setState({ kind: "error", message: msg });
        return;
      }

      try {
        const t = raw.teacher as Record<string, unknown>;
        const teacherId = typeof t.id === "string" ? t.id.trim() : "";
        if (!teacherId) {
          console.error("[PublicBooking] Step=teacher_id_empty after ok");
          setState({
            kind: "error",
            message: heUi.publicBooking.invalidSlugMessage,
          });
          return;
        }

        const businessType = coerceBusinessType(t.businessType);
        const identity: PublicBookingIdentity = {
          businessName: typeof t.businessName === "string" ? t.businessName : "",
          teacherName: typeof t.fullName === "string" ? t.fullName : "",
          phone: typeof t.phone === "string" ? t.phone : "",
        };

        const availability = normalizeAvailabilitySettings(
          raw.availability ?? { teacherId },
        );

        console.log("[PublicBooking] Step=ready", {
          teacherId,
          businessType,
          businessName: identity.businessName,
          bookingEnabled: availability.bookingEnabled,
        });

        setState({
          kind: "ready",
          teacherId,
          businessType,
          identity,
          availability,
        });
      } catch (parseErr) {
        console.error("[PublicBooking] Step=parse_bootstrap_payload failed:", parseErr);
        setState({
          kind: "error",
          message: heUi.publicBooking.invalidSlugMessage,
        });
      }
    } catch (e) {
      console.error("[PublicBooking] Load error:", e);
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
      businessType={state.businessType}
      identity={state.identity}
      availability={state.availability}
    />
  );
}
