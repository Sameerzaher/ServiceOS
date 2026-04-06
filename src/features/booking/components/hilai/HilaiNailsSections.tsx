"use client";

import { cn } from "@/lib/cn";

import {
  HILAI_NAILS_SERVICES,
  HILAI_SERVICE_EMOJI,
} from "@/features/booking/hilai/constants";

/** Consistent section titles */
export function HilaiSectionHeading({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-lg font-semibold tracking-tight text-stone-800 sm:text-xl">
        {title}
      </h2>
      {hint ? (
        <p className="text-[13px] leading-relaxed text-stone-500 sm:text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

export function HilaiNailsHero({
  title,
  subtitle,
  supportingLine,
}: {
  title: string;
  subtitle: string;
  supportingLine: string;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-pink-100/80",
        "bg-gradient-to-b from-[#fce7f3] via-white to-[#faf5ff]",
        "px-5 pb-10 pt-10 shadow-[0_20px_60px_-24px_rgba(219,39,119,0.22),0_0_0_1px_rgba(255,255,255,0.8)_inset]",
        "sm:rounded-[2rem] sm:px-8 sm:pb-12 sm:pt-12",
      )}
    >
      <div
        className="pointer-events-none absolute -left-16 -top-20 size-[14rem] rounded-full bg-pink-200/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-12 size-[12rem] rounded-full bg-violet-200/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-6 h-1 w-16 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-pink-300/60 to-transparent sm:top-8"
        aria-hidden
      />

      <div className="relative mx-auto max-w-sm text-center sm:max-w-md">
        <h1 className="text-balance font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-[22ch] text-[15px] leading-relaxed text-stone-600 sm:mt-5 sm:max-w-none sm:text-lg">
          {subtitle}
        </p>
        <p className="mx-auto mt-5 max-w-[28ch] text-[13px] leading-relaxed text-stone-500 sm:text-[15px]">
          {supportingLine}
        </p>
      </div>
    </header>
  );
}

export function HilaiNailsTrustStrip({ lineA, lineB }: { lineA: string; lineB: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-pink-100/70 bg-white/70 px-4 py-4",
        "shadow-md shadow-pink-200/20 backdrop-blur-sm",
        "sm:px-6 sm:py-5",
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[15px] font-medium leading-snug text-stone-700 sm:text-base">{lineA}</p>
        <span className="text-pink-300" aria-hidden>
          ·
        </span>
        <p className="text-[13px] leading-relaxed text-stone-500 sm:text-sm">{lineB}</p>
      </div>
    </div>
  );
}

export function HilaiNailsServiceGrid({
  selected,
  onSelect,
  disabled,
  heading,
  hint,
}: {
  selected: string | null;
  onSelect: (name: string) => void;
  disabled?: boolean;
  heading: string;
  hint?: string;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <HilaiSectionHeading title={heading} hint={hint} />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
        {HILAI_NAILS_SERVICES.map((name) => {
          const isOn = selected === name;
          const emoji = HILAI_SERVICE_EMOJI[name] ?? "💅";
          return (
            <li key={name}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(name)}
                aria-pressed={isOn}
                className={cn(
                  "group flex w-full min-h-[4.25rem] items-center gap-3 rounded-xl border bg-white p-4 shadow-md transition-all duration-200 sm:min-h-[4.5rem] sm:p-5",
                  "touch-manipulation",
                  disabled && "cursor-not-allowed opacity-50",
                  isOn
                    ? "border-pink-400/80 shadow-lg shadow-pink-300/30 ring-2 ring-pink-300/50"
                    : "border-stone-100/90 shadow-stone-200/40 hover:scale-[1.02] hover:border-pink-200/90 hover:shadow-lg hover:shadow-pink-200/25 active:scale-[0.98]",
                )}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 text-start text-[15px] font-semibold leading-snug sm:text-base",
                    isOn ? "text-pink-950" : "text-stone-800 group-hover:text-stone-900",
                  )}
                >
                  {name}
                </span>
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-violet-50 text-2xl shadow-inner sm:size-14 sm:text-[1.65rem]"
                  aria-hidden
                >
                  {emoji}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
