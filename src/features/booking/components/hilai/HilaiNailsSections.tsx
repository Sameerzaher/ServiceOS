"use client";

import { cn } from "@/lib/cn";

import { HILAI_NAILS_SERVICES } from "@/features/booking/hilai/constants";

/** Consistent section titles — warm, editorial, not “system”. */
export function HilaiSectionHeading({
  title,
  hint,
}: {
  title: string;
  /** Optional softer line under the title */
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-medium tracking-tight text-stone-800 sm:text-[1.35rem]">
        {title}
      </h2>
      {hint ? (
        <p className="text-[13px] leading-relaxed text-stone-500 sm:text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

export function HilaiNailsHero({
  businessName,
  subtitle,
}: {
  businessName: string;
  subtitle: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-rose-100/40 bg-gradient-to-b from-[#fff9fb] via-[#fef6f8] to-[#faf8ff] px-6 pb-12 pt-11 shadow-[0_24px_56px_-20px_rgba(200,150,170,0.28)] sm:px-10 sm:pb-14 sm:pt-14">
      {/* Soft light bloom — no harsh neon */}
      <div
        className="pointer-events-none absolute -left-20 -top-24 size-[13rem] rounded-full bg-gradient-to-br from-rose-200/25 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 size-[11rem] rounded-full bg-gradient-to-tl from-violet-200/20 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-px w-12 -translate-x-1/2 bg-gradient-to-r from-transparent via-rose-300/50 to-transparent sm:top-10"
        aria-hidden
      />

      <div className="relative mx-auto max-w-sm text-center sm:max-w-none">
        <p className="text-[13px] font-medium text-rose-400/90 sm:text-sm">סטודיו לציפורניים</p>
        <h1 className="mt-3 font-serif text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-stone-900 sm:text-4xl sm:leading-tight">
          {businessName}
        </h1>
        <p className="mx-auto mt-4 max-w-[20rem] text-[15px] leading-relaxed text-stone-500 sm:mt-5 sm:max-w-md sm:text-base">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

export function HilaiNailsTrustLines({
  lineA,
  lineB,
}: {
  lineA: string;
  lineB: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/70 bg-white/55 px-5 py-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85),0_8px_28px_-12px_rgba(180,140,155,0.2)] backdrop-blur-md sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3.5 text-center">
        <p className="text-[15px] font-medium leading-snug text-stone-700 sm:text-base">{lineA}</p>
        <div
          className="mx-auto h-px w-10 bg-gradient-to-r from-transparent via-rose-200/90 to-transparent"
          aria-hidden
        />
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
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
        {HILAI_NAILS_SERVICES.map((name) => {
          const isOn = selected === name;
          return (
            <li key={name}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(name)}
                aria-pressed={isOn}
                className={cn(
                  "group relative flex w-full min-h-[3.25rem] items-center justify-center rounded-2xl border px-4 py-3.5 text-center text-[15px] font-medium transition-all duration-200 sm:min-h-[3.5rem] sm:py-4",
                  disabled && "cursor-not-allowed opacity-50",
                  isOn
                    ? "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-50/90 text-stone-900 shadow-[0_10px_28px_-14px_rgba(200,130,150,0.45)] ring-1 ring-rose-200/60"
                    : "border-stone-200/55 bg-white/90 text-stone-700 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:border-rose-200/60 hover:bg-[#fffafc] hover:shadow-[0_12px_28px_-12px_rgba(200,150,165,0.18)] active:scale-[0.99]",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-4 -top-px h-px bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-0 transition-opacity",
                    isOn && "opacity-100",
                  )}
                  aria-hidden
                />
                {name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
