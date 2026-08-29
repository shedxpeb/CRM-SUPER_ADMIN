import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Module key normalization ──────────────────────────────────────────────────
// The platform module catalog uses PLURAL keys (leads, customers, etc.)
// while the CRM database stores SINGULAR canonical keys (lead, customer, etc.).
// UserModuleAccess entries are stored in the CRM with singular keys, so we
// must normalize catalog keys to match when comparing state.
const MODULE_KEY_ALIASES: Record<string, string[]> = {
  dashboard: [],
  lead: ['leads'],
  customer: ['customers'],
  project: ['projects'],
  'item-master': ['item-masters'],
  inventory: ['inventories'],
  vendor: ['vendors'],
  'purchase-order': ['purchase-orders', 'purchases'],
  task: ['tasks'],
  user: ['users'],
  role: ['roles'],
  organization: ['organizations'],
  tracking: [],
  document: ['documents'],
  report: ['reports'],
  warehouse: ['warehouses'],
  system: ['systems'],
};

/** Canonical (singular) module key for a stored key, matching the backend. */
export function normalizeModuleKey(key: string): string {
  const k = (key || '').toLowerCase().trim();
  if (!k) return key;
  for (const [canonical, aliases] of Object.entries(MODULE_KEY_ALIASES)) {
    if (k === canonical || aliases.includes(k)) return canonical;
  }
  return k;
}
