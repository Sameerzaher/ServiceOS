import {
  DEFAULT_VERTICAL_ID,
  getVerticalPreset,
  type VerticalId,
} from "./verticals/registry";

/**
 * Active vertical for the app shell. Later: read from user settings, route, or env.
 */
let activeVerticalId: VerticalId = DEFAULT_VERTICAL_ID;

export function getActiveVerticalId(): VerticalId {
  return activeVerticalId;
}

/** Swap vertical at runtime (e.g. settings UI). */
export function setActiveVerticalId(id: VerticalId): void {
  activeVerticalId = id;
}

export function getActiveVerticalPreset() {
  return getVerticalPreset(activeVerticalId);
}
