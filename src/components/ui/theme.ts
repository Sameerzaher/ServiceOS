/** Shared Tailwind tokens — keep layouts consistent without a heavy design system. */
export const ui = {
  pageMain:
    "mx-auto min-h-dvh w-full max-w-2xl px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-10",
  pageStack: "flex flex-col gap-10 sm:gap-12",
  section: "space-y-4 sm:space-y-5",
  sectionHeading:
    "text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl",
  pageTitle: "text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl",
  pageSubtitle: "mt-2 text-sm text-neutral-600 sm:text-base",
  header:
    "mb-8 border-b border-neutral-200/90 pb-6 sm:mb-10 sm:pb-8",
  card: "rounded-xl border border-neutral-200 bg-white shadow-sm",
  cardHover: "transition hover:border-neutral-300",
  cardPadding: "p-4 sm:p-5",
  statCard:
    "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5",
  formCard:
    "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 sm:p-6",
  list: "flex w-full flex-col gap-3 sm:gap-4",
  listItem:
    "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5",
  input:
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-400/40",
  label: "mb-1 block text-sm font-medium text-neutral-800",
} as const;
