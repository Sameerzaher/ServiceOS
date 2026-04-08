"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { heUi } from "@/config";
import { useDashboardTeacherOptional } from "@/features/app/DashboardTeacherContext";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleToggle } from "@/components/LocaleToggle";

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/dashboard", label: heUi.nav.dashboard },
  { href: "/clients", label: heUi.nav.clients },
  { href: "/appointments", label: heUi.nav.lessons },
  { href: "/payments", label: heUi.nav.payments },
  { href: "/booking", label: heUi.nav.booking },
  { href: "/blocked-dates", label: "חופשות" },
  { href: "/teachers", label: heUi.nav.teachers },
  { href: "/settings", label: heUi.nav.settings },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TeacherScopeSelect() {
  const ctx = useDashboardTeacherOptional();
  const toast = useToast();
  
  if (!ctx || !ctx.teachersReady || ctx.teachers.length <= 1) {
    return null;
  }
  
  const getTeacherIcon = (businessType: string) => {
    switch (businessType) {
      case 'driving_instructor':
        return '🚗';
      case 'cosmetic_clinic':
        return '💉';
      default:
        return '👤';
    }
  };
  
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <label
        htmlFor="dashboard-teacher-scope"
        className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 sm:text-xs"
      >
        {heUi.nav.teacherContext}
      </label>
      <select
        id="dashboard-teacher-scope"
        className="max-w-[10rem] truncate rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm transition-colors hover:border-neutral-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-neutral-500 sm:max-w-[14rem] sm:text-sm"
        dir="ltr"
        value={ctx.teacherId}
        onChange={(e) => {
          const newTeacherId = e.target.value;
          const teacher = ctx.teachers.find(t => t.id === newTeacherId);
          ctx.setTeacherId(newTeacherId);
          
          // Show toast notification
          if (teacher) {
            const icon = getTeacherIcon(teacher.businessType);
            const businessName = teacher.businessName.trim() || teacher.fullName.trim();
            toast(`${icon} עברת ל-${businessName}`);
          }
        }}
      >
        {ctx.teachers.map((t) => {
          const label =
            t.businessName.trim() || t.fullName.trim() || t.slug || t.id;
          const icon = getTeacherIcon(t.businessType);
          return (
            <option key={t.id} value={t.id}>
              {icon} {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, teacher, isAdmin } = useAuth();
  const toast = useToast();
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

  async function handleLogout(): Promise<void> {
    if (!confirm("האם אתה בטוח שברצונך להתנתק?")) return;
    
    try {
      await logout();
      toast("התנתקת בהצלחה 👋");
      router.push("/login");
    } catch (error) {
      console.error("[AppShell] Logout error:", error);
      toast("שגיאה בהתנתקות");
    }
  }

  const linkActive =
    "bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100";
  const linkInactive =
    "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

  // Filter nav items based on role
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.href === "/teachers") {
      return isAdmin; // Only admins see Teachers link
    }
    return true;
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <nav className="mx-auto max-w-5xl" aria-label="ניווט ראשי">
          <div className="flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-4 sm:px-6 sm:py-3">
            <Link
              href="/"
              className="flex min-h-[2.5rem] shrink-0 items-center gap-1.5 py-1 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:gap-2 sm:text-lg"
            >
              <span className="text-xl sm:text-2xl">📅</span>
              <span className="hidden sm:inline">{heUi.nav.brand}</span>
            </Link>
            <div className="hidden items-center gap-0.5 lg:flex">
              {visibleNavItems.map((item) => {
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
            
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:flex-initial sm:justify-start sm:gap-2">
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                <LocaleToggle />
                <ThemeToggle />
              </div>
              <NotificationBell />
              <TeacherScopeSelect />
              
              {teacher && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden min-h-[2.5rem] items-center gap-1.5 rounded-lg border-2 border-red-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:shadow-md active:scale-95 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-neutral-700 lg:inline-flex"
                  title="התנתק מהמערכת"
                >
                  <span>🚪</span>
                  <span>התנתק</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={handleBack}
                disabled={!isMounted || !canGoBack}
                className={cn(
                  "hidden min-h-[2.5rem] items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:inline-flex",
                  !isMounted || !canGoBack
                    ? "pointer-events-none invisible"
                    : "",
                )}
              >
                <span aria-hidden className="rtl:rotate-180">
                  ←
                </span>
                <span className="hidden lg:inline">{heUi.nav.back}</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95 sm:hidden"
        aria-label="ניווט מהיר"
      >
        <ul className={cn(
          "mx-auto grid max-w-full gap-0",
          isAdmin ? "grid-cols-7" : "grid-cols-6"
        )}>
          {visibleNavItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            const shortLabel = item.label.split(' ')[0];
            return (
              <li key={item.href} className="flex min-w-0 justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[3.5rem] w-full min-w-0 flex-col items-center justify-center border-t-2 px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition",
                    active
                      ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                      : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="truncate">{shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex min-w-0 justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[3.5rem] w-full min-w-0 flex-col items-center justify-center border-t-2 border-transparent px-1 py-1.5 text-center text-[10px] font-medium leading-tight text-red-600 transition hover:text-red-700 dark:text-red-400"
            >
              🚪
              <span className="mt-0.5 truncate">יציאה</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
