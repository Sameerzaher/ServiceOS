"use client";

import { cn } from "@/lib/cn";

import {
  HILAI_NAILS_SERVICES,
  HILAI_SERVICE_EMOJI,
} from "@/features/booking/hilai/constants";

export function HilaiSectionHeading({
  title,
  hint,
  stepNumber,
}: {
  title: string;
  hint?: string;
  /** Clear step marker for conversion flow */
  stepNumber?: 1 | 2 | 3;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        {stepNumber != null ? (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-50 text-sm font-extrabold text-pink-700 shadow-sm ring-2 ring-white"
            aria-hidden
          >
            {stepNumber}
          </span>
        ) : null}
        <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug tracking-tight text-stone-800 sm:text-xl">
          {title}
        </h2>
      </div>
      {hint ? (
        <p className="text-[13px] leading-relaxed text-stone-500 sm:text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

/** Subtle brand mark — swap for real logo image later */
function HilaiLogoPlaceholder() {
  return (
    <div
      className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-pink-200/50 bg-white/80 text-3xl shadow-md shadow-pink-200/25 ring-4 ring-pink-50/80"
      aria-hidden
    >
      💅
    </div>
  );
}

export function HilaiNailsHero({
  primaryHook,
  instructionLine,
  title,
  subtitle,
  showLogoPlaceholder = true,
}: {
  /** Main value prop — may contain \n for two lines */
  primaryHook: string;
  instructionLine: string;
  title: string;
  subtitle: string;
  showLogoPlaceholder?: boolean;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-pink-100/80",
        "bg-gradient-to-b from-[#fce7f3] via-[#fffafd] to-[#f5f0ff]",
        "px-5 pb-11 pt-9 shadow-[0_24px_64px_-28px_rgba(219,39,119,0.2),0_0_0_1px_rgba(255,255,255,0.85)_inset]",
        "sm:rounded-[2rem] sm:px-10 sm:pb-12 sm:pt-10",
      )}
    >
      <div
        className="pointer-events-none absolute -left-20 -top-24 size-[15rem] rounded-full bg-pink-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 size-[13rem] rounded-full bg-violet-200/35 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-sm text-center sm:max-w-md">
        {showLogoPlaceholder ? <HilaiLogoPlaceholder /> : null}

        <p
          className="whitespace-pre-line text-balance text-[1.5rem] font-extrabold leading-snug tracking-tight text-stone-900 sm:text-[2rem] sm:leading-[1.15]"
        >
          {primaryHook}
        </p>

        <p className="mx-auto mt-5 max-w-[28ch] text-[15px] font-medium leading-relaxed text-stone-500 sm:mt-6 sm:max-w-none sm:text-base">
          {instructionLine}
        </p>

        <p className="mt-8 text-base font-semibold text-pink-900/85 sm:text-lg">{title}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-stone-600 sm:text-sm">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

/** Single-line trust microcopy — high clarity, low noise */
export function HilaiTrustMicroLine({ text }: { text: string }) {
  return (
    <p className="text-center text-[13px] font-medium leading-relaxed text-stone-500 sm:text-sm">
      {text}
    </p>
  );
}

export function HilaiNailsTrustChips({
  line1,
  line2,
  line3,
}: {
  line1: string;
  line2: string;
  line3: string;
}) {
  const items: { text: string; icon: string }[] = [
    { text: line1, icon: "✓" },
    { text: line2, icon: "🙌" },
    { text: line3, icon: "💬" },
  ];
  return (
    <div className="rounded-2xl border border-pink-100/80 bg-white/75 px-3 py-4 shadow-md shadow-pink-200/15 backdrop-blur-sm sm:px-5 sm:py-5">
      <ul className="flex flex-col gap-3 sm:gap-3.5">
        {items.map(({ text, icon }) => (
          <li
            key={text}
            className="flex items-start gap-3 rounded-xl bg-pink-50/50 px-3 py-2.5 text-start sm:items-center sm:py-2"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm"
              aria-hidden
            >
              {icon}
            </span>
            <span className="pt-0.5 text-[13px] leading-snug text-stone-700 sm:text-[14px]">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HilaiSectionDivider() {
  return (
    <div
      className="flex items-center gap-3 py-1"
      aria-hidden
    >
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-pink-200/70 to-transparent" />
      <span className="text-[10px] text-pink-300">✦</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-200/70 to-transparent" />
    </div>
  );
}

export function HilaiNailsServiceGrid({
  selected,
  onSelect,
  disabled,
  heading,
  hint,
  stepNumber = 1,
}: {
  selected: string | null;
  onSelect: (name: string) => void;
  disabled?: boolean;
  heading: string;
  hint?: string;
  stepNumber?: 1 | 2 | 3;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <HilaiSectionHeading title={heading} hint={hint} stepNumber={stepNumber} />
      <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
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
                  "group flex w-full min-h-[4.5rem] items-center gap-3 rounded-xl border bg-white p-4 shadow-md transition-all duration-200 sm:min-h-[4.75rem] sm:p-5",
                  "touch-manipulation",
                  disabled && "cursor-not-allowed opacity-50",
                  isOn
                    ? "border-pink-500/90 bg-gradient-to-br from-pink-50 to-white shadow-lg shadow-pink-300/35 ring-2 ring-pink-400/40"
                    : "border-stone-100 shadow-stone-200/50 hover:scale-[1.01] hover:border-pink-300/70 hover:shadow-lg hover:shadow-pink-200/30 active:scale-[0.99]",
                )}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 text-start text-[15px] font-bold leading-snug sm:text-base",
                    isOn ? "text-pink-950" : "text-stone-800",
                  )}
                >
                  {name}
                </span>
                <span
                  className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-violet-50 text-2xl shadow-inner sm:size-14 sm:text-[1.65rem]"
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
