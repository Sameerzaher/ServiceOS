"use client";

import { heUi } from "@/config";
import { cn } from "@/lib/cn";

export type OnboardingPhase = "client" | "appointment";

/** Section `id`s for scroll targets and page wiring. */
export const ONBOARDING_ANCHORS = {
  clientForm: "onboarding-first-client",
  lessonForm: "onboarding-first-lesson",
} as const;

export interface FirstRunOnboardingProps {
  phase: OnboardingPhase;
}

function scrollToAnchor(id: string): void {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/**
 * Compact first-run hints; hidden automatically when at least one appointment exists.
 */
export function FirstRunOnboarding({ phase }: FirstRunOnboardingProps) {
  const isClient = phase === "client";

  return (
    <section
      className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-amber-950 shadow-sm"
      aria-labelledby="onboarding-heading"
      role="region"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            id="onboarding-heading"
            className="text-sm font-semibold text-amber-950 sm:text-base"
          >
            {isClient ? heUi.onboarding.step1Title : heUi.onboarding.step2Title}
          </h2>
          <p className="text-sm leading-relaxed text-amber-900/95">
            {isClient ? heUi.onboarding.step1Hint : heUi.onboarding.step2Hint}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            scrollToAnchor(
              isClient
                ? ONBOARDING_ANCHORS.clientForm
                : ONBOARDING_ANCHORS.lessonForm,
            )
          }
          className={cn(
            "shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 shadow-sm transition",
            "hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600",
          )}
        >
          {heUi.onboarding.jumpToForm}
        </button>
      </div>
    </section>
  );
}
