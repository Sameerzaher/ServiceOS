/** Central keys for LocalStorage-backed domain data (adapter + migrations). */
export const STORAGE_KEYS = {
  clients: "serviceos.clients",
  appointments: "serviceos.appointments",
  settings: "serviceos.settings",
  meta: "serviceos.meta",
} as const;
