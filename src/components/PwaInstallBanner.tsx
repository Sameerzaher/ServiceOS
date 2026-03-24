"use client";

import { useEffect, useRef, useState } from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import type { BeforeInstallPromptEvent } from "@/types/pwa";
import { cn } from "@/lib/cn";

const SESSION_DISMISS_KEY = "pwa-install-dismissed";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function PwaInstallBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const installPromptSeen = useRef(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;
    if (readDismissed()) {
      setDismissed(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      installPromptSeen.current = true;
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowIosHint(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstall as EventListener,
    );

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos) {
      timer = setTimeout(() => {
        if (!installPromptSeen.current) setShowIosHint(true);
      }, 1500);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstall as EventListener,
      );
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismiss = (): void => {
    writeDismissed();
    setDismissed(true);
    setInstallEvent(null);
    setShowIosHint(false);
  };

  const handleInstall = async (): Promise<void> => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  if (dismissed || isStandaloneDisplay()) return null;

  const showChrome = installEvent !== null;
  const showBanner = showChrome || showIosHint;
  if (!showBanner) return null;

  return (
    <div
      dir="rtl"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[90] border-t border-neutral-200 bg-white/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:rounded-xl sm:border sm:p-4",
      )}
      role="region"
      aria-label={heUi.pwa.installRegionLabel}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {heUi.pwa.installTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {showChrome ? heUi.pwa.installChromeBody : heUi.pwa.installIosBody}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleDismiss}>
            {heUi.pwa.installDismiss}
          </Button>
          {showChrome ? (
            <Button type="button" variant="primary" onClick={handleInstall}>
              {heUi.pwa.installAction}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
