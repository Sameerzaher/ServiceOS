"use client";

import { cn } from "@/lib/cn";

import {
  HILAI_NAILS_SERVICES,
  HILAI_SERVICE_EMOJI,
} from "@/features/booking/hilai/constants";

export function HilaiSectionHeading({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold tracking-tight text-stone-800 sm:text-xl">
        {title}
      </h2>
      {hint ? (
        <p className="text-[13px] leading-relaxed text-stone-500 sm:text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

/** Optional logo area — feels bespoke for the business owner */
function HilaiLogoPlaceholder() {
  return (
    <div
      className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-pink-200/60 bg-white/60 text-2xl shadow-inner shadow-pink-100/40"
      aria-hidden
    >
      💅
    </div>
  );
}

export function HilaiNailsHero({
  title,
  subtitle,
  emotionalHook,
  instructionLine,
  showLogoPlaceholder = true,
}: {
  title: string;
  subtitle: string;
  emotionalHook: string;
  instructionLine: string;
  showLogoPlaceholder?: boolean;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-pink-100/80",
        "bg-gradient-to-b from-[#fce7f3] via-[#fffafd] to-[#f5f0ff]",
        "px-5 pb-10 pt-8 shadow-[0_24px_64px_-28px_rgba(219,39,119,0.2),0_0_0_1px_rgba(255,255,255,0.85)_inset]",
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

        <h1 className="text-balance font-serif text-[1.85rem] font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 text-[15px] leading-relaxed text-stone-600 sm:mt-4 sm:text-lg">
          {subtitle}
        </p>
        <p className="mx-auto mt-5 max-w-[26ch] text-[16px] font-semibold leading-snug text-pink-900/90 sm:max-w-md sm:text-[17px]">
          {emotionalHook}
        </p>
        <p className="mx-auto mt-6 text-[14px] font-medium text-stone-600 sm:text-[15px]">
          {instructionLine}
        </p>
      </div>
    </header>
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
