import { normalizeAvailabilitySettings } from "@/core/types/availability";
import { normalizeAppSettings } from "@/core/types/settings";
import { loadFromStorage, saveToStorage } from "@/core/utils/storage";

import { parseAppointmentsArray, parseClientsArray } from "./entityNormalize";
import { STORAGE_KEYS } from "./keys";

/** Bump when persisted shape or semantics change; migrations run for lower values. */
export const STORAGE_SCHEMA_VERSION = 1;

export type StorageBootstrapResult =
  | { ok: true; migratedFrom: number }
  | { ok: false; reason: "unknown_schema_version"; version: number };

let lastBootstrapResult: StorageBootstrapResult | null = null;
let bootstrapDone = false;

export function getLastStorageBootstrapResult(): StorageBootstrapResult | null {
  return lastBootstrapResult;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function readMetaVersion(): number {
  const raw = loadFromStorage<unknown>(STORAGE_KEYS.meta);
  if (!isRecord(raw)) return 0;
  const v = raw.schemaVersion;
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.trunc(v);
}

function writeMetaVersion(version: number): void {
  saveToStorage(STORAGE_KEYS.meta, { schemaVersion: version });
}

function clearDomainData(): void {
  saveToStorage(STORAGE_KEYS.clients, []);
  saveToStorage(STORAGE_KEYS.appointments, []);
  saveToStorage(STORAGE_KEYS.settings, normalizeAppSettings(null));
  saveToStorage(
    STORAGE_KEYS.availability,
    normalizeAvailabilitySettings(null),
  );
}

/** Re-save normalized domain rows (v0 → v1 and any future pre-write cleanup). */
function migrateToCurrentSchema(): void {
  const clientsRaw = loadFromStorage<unknown>(STORAGE_KEYS.clients);
  const clients = parseClientsArray(clientsRaw);
  saveToStorage(STORAGE_KEYS.clients, clients);

  const clientIds = new Set(clients.map((c) => c.id));
  const appointmentsRaw = loadFromStorage<unknown>(STORAGE_KEYS.appointments);
  const appointments = parseAppointmentsArray(appointmentsRaw, clientIds);
  saveToStorage(STORAGE_KEYS.appointments, appointments);

  const settingsRaw = loadFromStorage<unknown>(STORAGE_KEYS.settings);
  saveToStorage(STORAGE_KEYS.settings, normalizeAppSettings(settingsRaw));

  const availabilityRaw = loadFromStorage<unknown>(STORAGE_KEYS.availability);
  saveToStorage(
    STORAGE_KEYS.availability,
    normalizeAvailabilitySettings(availabilityRaw),
  );
}

function runStorageBootstrap(): StorageBootstrapResult {
  const v = readMetaVersion();

  if (v > STORAGE_SCHEMA_VERSION || v < 0) {
    clearDomainData();
    writeMetaVersion(STORAGE_SCHEMA_VERSION);
    return { ok: false, reason: "unknown_schema_version", version: v };
  }

  if (v < STORAGE_SCHEMA_VERSION) {
    migrateToCurrentSchema();
    writeMetaVersion(STORAGE_SCHEMA_VERSION);
    return { ok: true, migratedFrom: v };
  }

  return { ok: true, migratedFrom: v };
}

/**
 * Runs once per tab: migrations + schema meta. Safe to call from every adapter read/write.
 */
export function ensureStorageBootstrap(): void {
  if (typeof window === "undefined") return;
  if (bootstrapDone) return;
  bootstrapDone = true;
  try {
    lastBootstrapResult = runStorageBootstrap();
  } catch {
    clearDomainData();
    writeMetaVersion(STORAGE_SCHEMA_VERSION);
    lastBootstrapResult = {
      ok: false,
      reason: "unknown_schema_version",
      version: -1,
    };
  }
}
