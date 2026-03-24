import type { VerticalPreset } from "@/core/types/vertical";

import { drivingVerticalPreset } from "./driving";

/**
 * Register verticals here. Keys are stable ids (storage, future routes).
 * Add a new file under `verticals/`, import the preset, and add to this map.
 */
export const VERTICAL_REGISTRY = {
  driving: drivingVerticalPreset,
} as const satisfies Record<string, VerticalPreset>;

export type VerticalId = keyof typeof VERTICAL_REGISTRY;

export const DEFAULT_VERTICAL_ID: VerticalId = "driving";

export function getVerticalPreset(id: VerticalId): VerticalPreset {
  return VERTICAL_REGISTRY[id];
}

export function listVerticalIds(): VerticalId[] {
  return Object.keys(VERTICAL_REGISTRY) as VerticalId[];
}
