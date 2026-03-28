"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_BRANDING } from "@/config/branding";
import { Button } from "@/components/ui";

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Set demo mode flag in localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem("serviceos.demoMode", "true");
      window.localStorage.setItem("serviceos.dashboardTeacherId", "demo-teacher-id");
    }
  }, []);

  function startDemo() {
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow-xl">
        <div className="mb-6 text-6xl">{PRODUCT_BRANDING.icon}</div>
        <h1 className="mb-4 text-3xl font-bold text-neutral-900">
          דמו אינטראקטיבי
        </h1>
        <p className="mb-8 text-lg text-neutral-600">
          חקרו את {PRODUCT_BRANDING.name} עם נתוני דמו. כל מה שתשנו לא יישמר.
        </p>
        
        <div className="mb-8 space-y-3 rounded-lg bg-emerald-50 p-6 text-right text-sm">
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>נסו להוסיף לקוחות חדשים</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>קבעו תורים</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>התאימו הגדרות</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>צפו בדף הזמנה ציבורי</span>
          </p>
        </div>

        <Button variant="primary" onClick={startDemo} className="w-full">
          התחל דמו 🎮
        </Button>
        
        <p className="mt-6 text-sm text-neutral-500">
          רוצים את המערכת האמיתית?{" "}
          <a href="/signup" className="font-medium text-emerald-600 hover:underline">
            הירשמו בחינם
          </a>
        </p>
      </div>
    </div>
  );
}
