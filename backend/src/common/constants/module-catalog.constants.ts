/**
 * Platform module catalog.
 *
 * Single source of truth for the modules a tenant can enable/disable. The
 * platform keeps PLURAL keys in `Tenant.modulesEnabled`; `updateModules`
 * normalizes them to CRM canonical singular keys when propagating to the CRM
 * OrganizationModule table (see `normalizeModuleKey`).
 */
export interface ModuleCatalogEntry {
  key: string;
  label: string;
  category: string;
}

export const MODULE_CATALOG: ModuleCatalogEntry[] = [
  { key: 'dashboard', label: 'Dashboard', category: 'operations' },
  { key: 'leads', label: 'Leads', category: 'sales' },
  { key: 'customers', label: 'Customers', category: 'sales' },
  { key: 'projects', label: 'Projects', category: 'operations' },
  { key: 'vendors', label: 'Vendors', category: 'operations' },
  { key: 'inventory', label: 'Inventory', category: 'operations' },
  { key: 'warehouse', label: 'Warehouse', category: 'operations' },
  { key: 'purchases', label: 'Purchase Orders', category: 'operations' },
  { key: 'tracking', label: 'Tracking', category: 'operations' },
  { key: 'reports', label: 'Reports', category: 'operations' },
  { key: 'tasks', label: 'Tasks', category: 'operations' },
  { key: 'documents', label: 'Documents', category: 'operations' },
  { key: 'users', label: 'Users', category: 'operations' },
  { key: 'roles', label: 'Roles', category: 'operations' },
];

export const MODULE_CATALOG_KEYS = MODULE_CATALOG.map((m) => m.key);
