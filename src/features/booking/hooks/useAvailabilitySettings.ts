"use client";

import { useCallback, useEffect, useState } from "react";

import { useServiceStorage } from "@/core/storage";
import {
  DEFAULT_AVAILABILITY_SETTINGS,
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";

export interface UseAvailabilitySettingsResult {
  settings: AvailabilitySettings;
  updateSettings: (patch: Partial<AvailabilitySettings>) => void;
  resetSettings: () => void;
}

export function useAvailabilitySettings(): UseAvailabilitySettingsResult {
  const storage = useServiceStorage();
  const [settings, setSettings] = useState<AvailabilitySettings>(
    DEFAULT_AVAILABILITY_SETTINGS,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSettings(storage.loadAvailabilitySettings());
    setIsReady(true);
  }, [storage]);

  useEffect(() => {
    if (!isReady) return;
    storage.persistAvailabilitySettings(settings);
  }, [settings, isReady, storage]);

  const updateSettings = useCallback((patch: Partial<AvailabilitySettings>) => {
    setSettings((prev) => normalizeAvailabilitySettings({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_AVAILABILITY_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

  