/** Shared Tailwind tokens — keep layouts consistent without a heavy design system. */
const inputBase =
  "w-full min-h-[2.75rem] rounded-xl border border-neutral-300/90 bg-white py-2.5 text-base leading-normal text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25";

const cardSurface =
  "rounded-2xl border border-neutral-200/80 bg-white shadow-sm ring-1 ring-neutral-950/[0.04]";

export const ui = {
  pageMain:
    "mx-auto min-h-dvh w-full max-w-2xl px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-10",
  pageStack: "flex flex-col gap-8 sm:gap-12",
  section: "space-y-4 sm:space-y-5",
  sectionHeading:
    "text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl",
  pageTitle: "text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl",
  pageSubtitle: "mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base",
  header: "mb-6 border-b border-neutral-200/70 pb-5 sm:mb-10 sm:pb-8",
  card: cardSurface,
  cardHover: "transition hover:border-emerald-200/80 hover:ring-emerald-900/[0.06]",
  cardPadding: "p-4 sm:p-5",
  statCard: `${cardSurface} p-3.5 sm:p-5`,
  formCard: `${cardSurface} p-5 sm:p-6`,
  list: "flex w-full flex-col gap-3.5 sm:gap-4",
  listItem: `${cardSurface} px-4 py-5 sm:p-5`,
  input: `${inputBase} px-3`,
  /** Native `<select>` — chevron + RTL padding via `.form-select` in `globals.css`. */
  select: `${inputBase} form-select`,
  label: "mb-1.5 block text-sm font-medium text-neutral-800",
} as const;
