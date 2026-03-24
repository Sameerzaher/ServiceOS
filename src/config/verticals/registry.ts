import type { ActivePreset } from "@/core/types/settings";
import type { VerticalPreset } from "@/core/types/vertical";

import { beautyVerticalPreset } from "./beauty";
import { drivingVerticalPreset } from "./driving";
import { fitnessVerticalPreset } from "./fitness";

/**
 * Register verticals here. Keys match `AppSettings.activePreset` (storage).
 */
export const VERTICAL_REGISTRY = {
  driving: drivingVerticalPreset,
  fitness: fitnessVerticalPreset,
  beauty: beautyVerticalPreset,
} as const satisfies Record<ActivePreset, VerticalPreset>;

export type VerticalId = ActivePreset;

export const DEFAULT_VERTICAL_ID: VerticalId = "driving";

export function getVerticalPreset(id: VerticalId): VerticalPreset {
  return VERTICAL_REGISTRY[id];
}

export function listVerticalIds(): VerticalId[] {
  return Object.keys(VERTICAL_REGISTRY) as VerticalId[];
}
