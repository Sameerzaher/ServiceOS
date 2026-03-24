"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { heUi } from "@/config";
import { cn } from "@/lib/cn";

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: heUi.nav.dashboard },
  { href: "/clients", label: heUi.nav.clients },
  { href: "/appointments", label: heUi.nav.lessons },
  { href: "/booking", label: heUi.nav.booking },
  { href: "/settings", label: heUi.nav.settings },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    router.back();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/90 shadow-sm shadow-black/5 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
        <nav className="mx-auto max-w-5xl" aria-label="ניווט ראשי">
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
            <Link
              href="/"
              className="flex min-h-[2.75rem] items-center py-1 text-lg font-semibold tracking-tight text-emerald-950"
            >
              {heUi.nav.brand}
            </Link>
            <div className="hidden items-center gap-1 sm:flex md:flex-nowrap">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "min-h-[2.5rem] rounded-xl px-2.5 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-emerald-700 text-white shadow-sm shadow-emerald-900/20"
                        : "text-neutral-600 hover:bg-emerald-50/80 hover:text-emerald-950",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center rounded-xl border border-neutral-200/80 bg-white/60 p-1 shadow-sm">
              <button
                type="button"
                onClick={handleBack}
                disabled={!isMounted || !canGoBack}
                className={cn(
                  "inline-flex min-h-[2.5rem] items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:min-h-0 sm:px-3 sm:py-1.5",
                  "text-neutral-700 hover:bg-emerald-50/90 hover:text-emerald-950",
                  !isMounted || !canGoBack
                    ? "pointer-events-none invisible"
                    : "",
                )}
              >
                <span aria-hidden className="rtl:rotate-180">
                  ←
                </span>
                <span>{heUi.nav.back}</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border border-neutral-200/70 border-b-0 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_32px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:hidden"
        aria-label="ניווט מהיר"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0 px-1 pt-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href} className="flex min-w-0 justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[3.25rem] w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-t-xl px-3 py-1.5 text-center text-xs font-medium leading-tight transition",
                    active
                      ? "bg-emerald-700 text-white shadow-inner shadow-emerald-900/20"
                      : "text-neutral-600 hover:bg-emerald-50/80 hover:text-emerald-950",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
