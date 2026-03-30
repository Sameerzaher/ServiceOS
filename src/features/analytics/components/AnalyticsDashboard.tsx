"use client";

import { useEffect, useState } from "react";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";
import { formatIls } from "@/core/utils/currency";
import { InlineLoading } from "@/components/ui";

interface AnalyticsStats {
  totalRevenue: number;
  completedLessons: number;
  cancelledLessons: number;
  activeClients: number;
  cancellationRate: number;
  averageLessonPrice: number;
  unpaidAmount: number;
  thisMonthRevenue: number;
  thisMonthLessons: number;
}

export function AnalyticsDashboard() {
  const teacherId = useDashboardTeacherId();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/analytics", {
          headers: mergeTeacherScopeHeaders(teacherId),
        });

        if (!res.ok) {
          if (!cancelled) {
            setError("שגיאה בטעינת נתונים");
            setLoading(false);
          }
          return;
        }

        const data = await res.json();
        if (data.ok && data.stats) {
          if (!cancelled) {
            setStats(data.stats);
            setLoading(false);
          }
        } else {
          if (!cancelled) {
            setError("נתונים לא תקינים");
            setLoading(false);
          }
        }
      } catch (e) {
        console.error("[AnalyticsDashboard] Error:", e);
        if (!cancelled) {
          setError("שגיאה בטעינת נתונים");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <InlineLoading />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-900">
        {error || "לא ניתן לטעון נתונים"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">סטטיסטיקות</h2>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="הכנסות כוללות"
          value={formatIls(stats.totalRevenue)}
          icon="💰"
          color="emerald"
        />
        <StatCard
          title="שיעורים שהושלמו"
          value={stats.completedLessons.toString()}
          icon="✅"
          color="blue"
        />
        <StatCard
          title="תלמידים פעילים"
          value={stats.activeClients.toString()}
          icon="👥"
          color="violet"
        />
        <StatCard
          title="הכנסות החודש"
          value={formatIls(stats.thisMonthRevenue)}
          subtitle={`${stats.thisMonthLessons} שיעורים`}
          icon="📅"
          color="cyan"
        />
        <StatCard
          title="חובות"
          value={formatIls(stats.unpaidAmount)}
          icon="⚠️"
          color="amber"
        />
        <StatCard
          title="אחוז ביטולים"
          value={`${stats.cancellationRate}%`}
          subtitle={`${stats.cancelledLessons} בוטלו`}
          icon="📊"
          color={stats.cancellationRate > 20 ? "rose" : "neutral"}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800 sm:p-4">
        <h3 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          נתונים נוספים
        </h3>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600 dark:text-neutral-400">מחיר ממוצע לשיעור:</dt>
            <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
              {formatIls(stats.averageLessonPrice)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600 dark:text-neutral-400">סה״כ שיעורים שבוצעו:</dt>
            <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
              {stats.completedLessons + stats.cancelledLessons}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: "emerald" | "blue" | "violet" | "cyan" | "amber" | "rose" | "neutral";
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
    blue: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
    violet: "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950",
    cyan: "border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    rose: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950",
    neutral: "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
  };

  return (
    <div
      className={`rounded-xl border p-3 shadow-sm transition hover:shadow-md sm:p-4 ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400 sm:text-xs">
            {title}
          </p>
          <p className="mt-1.5 text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:mt-2 sm:text-2xl">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-400 sm:text-xs">{subtitle}</p>
          )}
        </div>
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
    </div>
  );
}
