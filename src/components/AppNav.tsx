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
      className="border-b border-neutral-200/90 bg-white/90 backdrop-blur-sm"
      aria-label="ניווט ראשי"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-neutral-900"
        >
          {heUi.nav.brand}
        </Link>
        <Link
          href="/"
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
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
