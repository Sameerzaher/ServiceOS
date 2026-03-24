import type { AppSettings } from "@/core/types/settings";
import type { VerticalPreset } from "@/core/types/vertical";

import {
  DEFAULT_VERTICAL_ID,
  VERTICAL_REGISTRY,
  getVerticalPreset,
  type VerticalId,
} from "./verticals/registry";

/**
 * Resolves the active `VerticalPreset` from persisted settings.
 * Defaults to driving when missing or invalid.
 */
export function resolveVerticalPresetFromSettings(
  settings: AppSettings,
): VerticalPreset {
  const raw = settings.activePreset;
  if (raw && raw in VERTICAL_REGISTRY) {
    return getVerticalPreset(raw as VerticalId);
  }
  return getVerticalPreset(DEFAULT_VERTICAL_ID);
}
