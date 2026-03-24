"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { heUi } from "@/config";
import { cn } from "@/lib/cn";

export function AppNav() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCanGoBack(window.history.length > 1);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const onPopState = (): void => {
      setCanGoBack(window.history.length > 1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isMounted]);

  function handleBack(): void {
    if (!canGoBack) return;
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

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
        <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50/80 p-1">
          <button
            type="button"
            onClick={handleBack}
            disabled={!isMounted || !canGoBack}
            className={cn(
              "inline-flex min-h-[2.5rem] items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:min-h-0 sm:px-3 sm:py-1.5",
              "text-neutral-700 hover:bg-neutral-100",
              !isMounted || !canGoBack
                ? "pointer-events-none invisible"
                : "",
            )}
          >
            <span aria-hidden>←</span>
            <span>{heUi.nav.back}</span>
          </button>
          <Link
            href="/"
            className={cn(
              "inline-flex min-h-[2.5rem] items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition sm:min-h-0 sm:px-3 sm:py-1.5",
              "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            {heUi.nav.home}
          </Link>
        </div>
      </div>
    </nav>
  );
}
