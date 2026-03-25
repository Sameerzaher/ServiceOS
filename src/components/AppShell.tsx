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

  const linkActive =
    "bg-neutral-100 font-semibold text-neutral-900";
  const linkInactive =
    "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <nav className="mx-auto max-w-5xl" aria-label="ניווט ראשי">
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
            <Link
              href="/"
              className="flex min-h-[2.75rem] items-center py-1 text-lg font-semibold tracking-tight text-neutral-900"
            >
              {heUi.nav.brand}
            </Link>
            <div className="hidden items-center gap-0.5 sm:flex">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "min-h-[2.5rem] rounded-lg px-2.5 py-1.5 text-sm transition",
                      active ? linkActive : linkInactive,
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleBack}
              disabled={!isMounted || !canGoBack}
              className={cn(
                "inline-flex min-h-[2.5rem] items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50",
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
        </nav>
      </header>

      <div className="flex flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom,0px)] sm:hidden"
        aria-label="ניווט מהיר"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href} className="flex min-w-0 justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[3.25rem] w-full min-w-0 flex-col items-center justify-center border-t-2 px-1 py-1.5 text-center text-[11px] font-medium leading-tight transition",
                    active
                      ? "border-neutral-900 text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-800",
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
