"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import type { Client, ClientId } from "@/core/types/client";
import { isSupabaseConfigured } from "@/core/storage";
import { createId } from "@/core/utils/ids";

export type NewClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

export type ClientPatch = Partial<Omit<Client, "id" | "createdAt">>;

export interface UseClientsResult {
  clients: Client[];
  /** Clients sorted by `fullName` (Hebrew locale). */
  sortedClients: Client[];
  isReady: boolean;
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  retrySync: () => void;
  addClient: (input: NewClientInput) => Client | null;
  updateClient: (id: ClientId, patch: ClientPatch) => void;
  deleteClient: (id: ClientId) => void;
  /** Replace entire list (demo seed / reset). */
  replaceClients: (next: Client[]) => void;
}

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; error: string };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function normalizeClient(raw: unknown): Client | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : "";
  const fullName = typeof raw.fullName === "string" ? raw.fullName : "";
  const phone = typeof raw.phone === "string" ? raw.phone : "";
  const notes = typeof raw.notes === "string" ? raw.notes : "";
  const customFields =
    isRecord(raw.customFields) ? raw.customFields : ({} as Record<string, unknown>);
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : "";
  if (!id || fullName.trim().length < 2 || !createdAt || !updatedAt) return null;
  return {
    id,
    fullName: fullName.trim(),
    phone: phone.trim(),
    notes: notes.trim(),
    customFields,
    createdAt,
    updatedAt,
  };
}

async function apiGetStudents(): Promise<Client[]> {
  const res = await fetch("/api/students", { method: "GET" });
  const data = (await res.json()) as ApiOk<{ students?: unknown[] }> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "GET /api/students failed");
  }
  const students: Client[] = [];
  for (const row of data.students ?? []) {
    const parsed = normalizeClient(row);
    if (parsed) students.push(parsed);
  }
  return students;
}

async function apiCreateStudent(student: Client): Promise<void> {
  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  const data = (await res.json()) as ApiOk<{ student?: unknown }> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "POST /api/students failed");
  }
}

async function apiUpdateStudent(id: string, patch: ClientPatch): Promise<void> {
  const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = (await res.json()) as ApiOk<Record<string, never>> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "PUT /api/students/:id failed");
  }
}

async function apiDeleteStudent(id: string): Promise<void> {
  const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const data = (await res.json()) as ApiOk<Record<string, never>> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "DELETE /api/students/:id failed");
  }
}

async function reconcileStudentsSnapshot(next: Client[]): Promise<void> {
  const current = await apiGetStudents();
  const nextById = new Map(next.map((row) => [row.id, row]));
  const currentById = new Map(current.map((row) => [row.id, row]));

  for (const [id, row] of Array.from(nextById.entries())) {
    if (currentById.has(id)) {
      await apiUpdateStudent(id, {
        fullName: row.fullName,
        phone: row.phone,
        notes: row.notes,
        customFields: row.customFields,
        updatedAt: row.updatedAt,
      });
    } else {
      await apiCreateStudent(row);
    }
  }
  for (const [id] of Array.from(currentById.entries())) {
    if (!nextById.has(id)) {
      await apiDeleteStudent(id);
    }
  }
}

export function useClients(): UseClientsResult {
  const remote = isSupabaseConfigured();
  const [clients, setClients] = useState<Client[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setSyncError(null);
    void (async () => {
      try {
        if (!remote) {
          throw new Error("Supabase is not configured");
        }
        const rows = await apiGetStudents();
        if (!cancelled) {
          setClients(rows);
        }
      } catch (e) {
        console.error("[ServiceOS] useClients load", e);
        if (!cancelled) setLoadError(heUi.data.loadFailedTitle);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadKey, remote]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setIsReady(false);
    setLoadKey((k) => k + 1);
  }, []);

  const retrySync = useCallback(() => {
    setSyncError(null);
    void (async () => {
      try {
        if (!remote) {
          throw new Error("Supabase is not configured");
        }
        await reconcileStudentsSnapshot(clients);
        setSyncError(null);
      } catch (e) {
        console.error("[ServiceOS] useClients retrySync", e);
        setSyncError(heUi.data.syncFailedTitle);
      }
    });
  }, [clients, remote]);

  function addClient(input: NewClientInput): Client | null {
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return null;
    }
    const id = createId();
    if (!id) return null;

    const now = new Date().toISOString();
    const client: Client = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };

    setClients((prev) => [...prev, client]);
    setSyncError(null);
    void (async () => {
      try {
        await apiCreateStudent(client);
      } catch (e) {
        console.error("[ServiceOS] useClients add", e);
        setClients((prev) => prev.filter((row) => row.id !== client.id));
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
    return client;
  }

  function updateClient(id: ClientId, patch: ClientPatch): void {
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return;
    }
    let before: Client | null = null;
    let after: Client | null = null;
    setClients((prev) => {
      const next = prev.map((client) => {
        if (client.id !== id) return client;
        before = client;
        after = {
          ...client,
          ...patch,
          id: client.id,
          createdAt: client.createdAt,
          updatedAt: new Date().toISOString(),
        };
        return after;
      });
      return next;
    });
    setSyncError(null);
    void (async () => {
      try {
        await apiUpdateStudent(id, patch);
      } catch (e) {
        console.error("[ServiceOS] useClients update", e);
        if (before) {
          setClients((prev) => prev.map((row) => (row.id === id ? before! : row)));
        }
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
  }

  function deleteClient(id: ClientId): void {
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return;
    }
    let removed: Client | null = null;
    setClients((prev) => {
      removed = prev.find((row) => row.id === id) ?? null;
      return prev.filter((client) => client.id !== id);
    });
    setSyncError(null);
    void (async () => {
      try {
        await apiDeleteStudent(id);
      } catch (e) {
        console.error("[ServiceOS] useClients delete", e);
        if (removed) {
          setClients((prev) => [...prev, removed!]);
        }
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
  }

  function replaceClients(next: Client[]): void {
    const prev = clients;
    setClients(next);
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return;
    }
    setSyncError(null);
    void (async () => {
      try {
        await reconcileStudentsSnapshot(next);
      } catch (e) {
        console.error("[ServiceOS] useClients replace", e);
        setClients(prev);
        setSyncError(heUi.data.syncFailedTitle);
      }
    });
  }

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        a.fullName.localeCompare(b.fullName, "he", { sensitivity: "base" }),
      ),
    [clients],
  );

  return {
    clients,
    sortedClients,
    isReady,
    loadError,
    syncError,
    retryLoad,
    retrySync,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
  };
}
