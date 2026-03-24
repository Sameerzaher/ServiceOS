"use client";

import { useCallback, useEffect, useState } from "react";

import { useServiceStorage } from "@/core/storage";
import {
  DEFAULT_APP_SETTINGS,
  normalizeAppSettings,
  type AppSettings,
} from "@/core/types/settings";

export interface UseSettingsResult {
  settings: AppSettings;
  isReady: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  replaceSettings: (next: AppSettings) => void;
}

export function useSettings(): UseSettingsResult {
  const storage = useServiceStorage();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSettings(storage.loadSettings());
    setIsReady(true);
  }, [storage]);

  useEffect(() => {
    if (!isReady) return;
    storage.persistSettings(settings);
  }, [settings, isReady, storage]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => normalizeAppSettings({ ...prev, ...patch }));
  }, []);

  const replaceSettings = useCallback((next: AppSettings) => {
    setSettings(normalizeAppSettings(next));
  }, []);

  return {
    settings,
    isReady,
    updateSettings,
    replaceSettings,
  };
}
