"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseDefaultTeacherId } from "@/core/config/supabaseEnv";
import { StorageProvider } from "@/core/storage/StorageContext";
import { createServiceStorage } from "@/core/storage/createServiceStorage";

const STORAGE_KEY = "serviceos.dashboardTeacherId";

export type DashboardTeacherSummary = {
  id: string;
  fullName: string;
  businessName: string;
  slug: string;
};

type DashboardTeacherContextValue = {
  teacherId: string;
  setTeacherId: (id: string) => void;
  teachers: DashboardTeacherSummary[];
  teachersReady: boolean;
  /** Public booking path segment for the selected teacher (`/book/[slug]`). */
  teacherSlug: string | null;
};

const DashboardTeacherContext = createContext<DashboardTeacherContextValue | null>(
  null,
);

export function useDashboardTeacherId(): string {
  const ctx = useContext(DashboardTeacherContext);
  if (ctx) return ctx.teacherId;
  return getSupabaseDefaultTeacherId();
}

/** Full dashboard teacher scope; `null` outside `(app)` layout. */
export function useDashboardTeacherOptional(): DashboardTeacherContextValue | null {
  return useContext(DashboardTeacherContext);
}

/** Selected teacher's booking slug for public URLs; `null` if unknown or outside the dashboard. */
export function useDashboardTeacherSlug(): string | null {
  return useContext(DashboardTeacherContext)?.teacherSlug ?? null;
}

type TeachersApiOk = { ok: true; teachers?: DashboardTeacherSummary[] };
type TeachersApiErr = { ok: false; error: string };

export function DashboardTeacherProvider({ children }: { children: ReactNode }) {
  const defaultId = getSupabaseDefaultTeacherId();
  const [teacherId, setTeacherIdState] = useState(defaultId);
  const [teachers, setTeachers] = useState<DashboardTeacherSummary[]>([]);
  const [teachersReady, setTeachersReady] = useState(false);

  const setTeacherId = useCallback((id: string) => {
    const next = id.trim();
    if (!next) return;
    setTeacherIdState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/teachers", { method: "GET" });
        const data = (await res.json()) as TeachersApiOk | TeachersApiErr;
        if (cancelled) return;
        if (!res.ok || !data || data.ok !== true) {
          setTeachersReady(true);
          return;
        }
        const list = data.teachers ?? [];
        setTeachers(list);

        let saved: string | null = null;
        try {
          saved = window.localStorage.getItem(STORAGE_KEY);
        } catch {
          saved = null;
        }

        if (saved && list.some((t) => t.id === saved)) {
          setTeacherIdState(saved);
        } else if (list.length > 0) {
          setTeacherIdState((current) =>
            list.some((t) => t.id === current) ? current : list[0].id,
          );
        }
      } catch (e) {
        console.error("[DashboardTeacher] load teachers", e);
      } finally {
        if (!cancelled) setTeachersReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const storage = useMemo(
    () => createServiceStorage(teacherId),
    [teacherId],
  );

  const teacherSlug = useMemo(() => {
    const row = teachers.find((t) => t.id === teacherId);
    const s = typeof row?.slug === "string" ? row.slug.trim() : "";
    if (s.length > 0) return s;
    const fallbackId = teacherId.trim();
    return fallbackId.length > 0 ? fallbackId : null;
  }, [teachers, teacherId]);

  const value = useMemo<DashboardTeacherContextValue>(
    () => ({
      teacherId,
      setTeacherId,
      teachers,
      teachersReady,
      teacherSlug,
    }),
    [teacherId, setTeacherId, teachers, teachersReady, teacherSlug],
  );

  return (
    <DashboardTeacherContext.Provider value={value}>
      <StorageProvider storage={storage}>{children}</StorageProvider>
    </DashboardTeacherContext.Provider>
  );
}
