"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { heUi } from "@/config";
import { cn } from "@/lib/cn";

export function AppNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav
      className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90"
      aria-label="ניווט ראשי"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="flex min-h-[2.75rem] items-center py-1 text-lg font-semibold tracking-tight text-neutral-900"
        >
          {heUi.nav.brand}
        </Link>
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5",
            isHome
              ? "bg-neutral-900 text-white"
              : "text-neutral-700 hover:bg-neutral-100",
          )}
        >
          {heUi.nav.home}
        </Link>
      </div>
    </nav>
  );
}
