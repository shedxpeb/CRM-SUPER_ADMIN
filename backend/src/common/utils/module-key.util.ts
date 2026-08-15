/**
 * Module key normalization.
 *
 * The CRM (ADMIN-CRM) canonicalizes module keys to SINGULAR form to match its
 * permission prefix format (`customer` <-> `customer:list`). The platform
 * tenant keeps plural keys (`customers`, `leads`, ...). When syncing module
 * enablement into the CRM `OrganizationModule` table, keys must be converted
 * to the canonical singular form so the CRM guards resolve them.
 */

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

/** Canonical (singular) module key for a stored key, tolerating legacy plural forms. */
export function normalizeModuleKey(key: string): string {
  const k = (key || '').toLowerCase().trim();
  if (!k) return key;
  for (const [canonical, aliases] of Object.entries(MODULE_KEY_ALIASES)) {
    if (k === canonical || aliases.includes(k)) return canonical;
  }
  return k;
}
