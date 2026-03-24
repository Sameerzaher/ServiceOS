"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";

export default function ClientProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={ui.pageMain}>
      <h1 className={ui.pageTitle}>{heUi.errors.pageTitle}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
        {heUi.errors.pageDescription}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={reset}>
          {heUi.errors.tryAgain}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/")}
        >
          {heUi.errors.goHome}
        </Button>
      </div>
    </main>
  );
}
