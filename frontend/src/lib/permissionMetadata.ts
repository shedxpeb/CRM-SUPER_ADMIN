/**
 * Permission Metadata Mapping
 * 
 * This file provides human-readable labels and descriptions for backend permission codes.
 * The backend permission codes remain unchanged - this is purely for frontend display.
 * 
 * Format:
 * - module: The display name of the module (e.g., "Lead", "Customer")
 * - label: Human-readable permission name (e.g., "View Leads", "Create Leads")
 * - description: Brief explanation of what the permission allows
 * - action: The CRUD action type (View, Create, Edit, Delete, Restore, Approve)
 */

export interface PermissionMetadata {
  module: string;
  label: string;
  description: string;
  action: 'View' | 'Create' | 'Edit' | 'Delete' | 'Restore' | 'Approve' | 'Other';
}

export const PERMISSION_METADATA: Record<string, PermissionMetadata> = {
  // Customer permissions
  'customer:list': {
    module: 'Customer',
    label: 'View Customers',
    description: 'Allows the user to view the list of customers',
    action: 'View',
  },
  'customer:read': {
    module: 'Customer',
    label: 'View Customer Details',
    description: 'Allows the user to view individual customer details',
    action: 'View',
  },
  'customer:create': {
    module: 'Customer',
    label: 'Create Customers',
    description: 'Allows the user to create new customers',
    action: 'Create',
  },
  'customer:update': {
    module: 'Customer',
    label: 'Edit Customers',
    description: 'Allows the user to edit customer information',
    action: 'Edit',
  },
  'customer:delete': {
    module: 'Customer',
    label: 'Delete Customers',
    description: 'Allows the user to delete customers',
    action: 'Delete',
  },
  'customer:restore': {
    module: 'Customer',
    label: 'Restore Customers',
    description: 'Allows the user to restore deleted customers',
    action: 'Restore',
  },

  // Dashboard permissions
  'dashboard:view': {
    module: 'Dashboard',
    label: 'View Dashboard',
    description: 'Allows the user to access the dashboard',
    action: 'View',
  },
  'dashboard:analytics': {
    module: 'Dashboard',
    label: 'View Analytics',
    description: 'Allows the user to view dashboard analytics',
    action: 'View',
  },

  // Document permissions
  'document:list': {
    module: 'Document',
    label: 'View Documents',
    description: 'Allows the user to view the list of documents',
    action: 'View',
  },
  'document:read': {
    module: 'Document',
    label: 'View Document Details',
    description: 'Allows the user to view individual document details',
    action: 'View',
  },
  'document:create': {
    module: 'Document',
    label: 'Create Documents',
    description: 'Allows the user to create new documents',
    action: 'Create',
  },
  'document:update': {
    module: 'Document',
    label: 'Edit Documents',
    description: 'Allows the user to edit document information',
    action: 'Edit',
  },
  'document:delete': {
    module: 'Document',
    label: 'Delete Documents',
    description: 'Allows the user to delete documents',
    action: 'Delete',
  },
  'document:download': {
    module: 'Document',
    label: 'Download Documents',
    description: 'Allows the user to download documents',
    action: 'View',
  },

  // Inventory permissions
  'inventory:list': {
    module: 'Inventory',
    label: 'View Inventory',
    description: 'Allows the user to view the inventory list',
    action: 'View',
  },
  'inventory:read': {
    module: 'Inventory',
    label: 'View Inventory Details',
    description: 'Allows the user to view individual inventory item details',
    action: 'View',
  },
  'inventory:create': {
    module: 'Inventory',
    label: 'Create Inventory Items',
    description: 'Allows the user to create new inventory items',
    action: 'Create',
  },
  'inventory:update': {
    module: 'Inventory',
    label: 'Edit Inventory Items',
    description: 'Allows the user to edit inventory item information',
    action: 'Edit',
  },
  'inventory:delete': {
    module: 'Inventory',
    label: 'Delete Inventory Items',
    description: 'Allows the user to delete inventory items',
    action: 'Delete',
  },
  'inventory:adjust': {
    module: 'Inventory',
    label: 'Adjust Inventory',
    description: 'Allows the user to adjust inventory quantities',
    action: 'Edit',
  },

  // Item Master permissions
  'item-master:list': {
    module: 'Item Master',
    label: 'View Item Master',
    description: 'Allows the user to view the item master list',
    action: 'View',
  },
  'item-master:read': {
    module: 'Item Master',
    label: 'View Item Master Details',
    description: 'Allows the user to view individual item master details',
    action: 'View',
  },
  'item-master:create': {
    module: 'Item Master',
    label: 'Create Item Master',
    description: 'Allows the user to create new item master entries',
    action: 'Create',
  },
  'item-master:update': {
    module: 'Item Master',
    label: 'Edit Item Master',
    description: 'Allows the user to edit item master information',
    action: 'Edit',
  },
  'item-master:delete': {
    module: 'Item Master',
    label: 'Delete Item Master',
    description: 'Allows the user to delete item master entries',
    action: 'Delete',
  },

  // Lead permissions
  'lead:list': {
    module: 'Lead',
    label: 'View Leads',
    description: 'Allows the user to view the list of leads',
    action: 'View',
  },
  'lead:read': {
    module: 'Lead',
    label: 'View Lead Details',
    description: 'Allows the user to view individual lead details',
    action: 'View',
  },
  'lead:create': {
    module: 'Lead',
    label: 'Create Leads',
    description: 'Allows the user to create new leads',
    action: 'Create',
  },
  'lead:update': {
    module: 'Lead',
    label: 'Edit Leads',
    description: 'Allows the user to edit lead information',
    action: 'Edit',
  },
  'lead:delete': {
    module: 'Lead',
    label: 'Delete Leads',
    description: 'Allows the user to delete leads',
    action: 'Delete',
  },
  'lead:restore': {
    module: 'Lead',
    label: 'Restore Leads',
    description: 'Allows the user to restore deleted leads',
    action: 'Restore',
  },
  'lead:convert': {
    module: 'Lead',
    label: 'Convert Leads',
    description: 'Allows the user to convert leads to customers',
    action: 'Edit',
  },

  // Organization permissions
  'organization:read': {
    module: 'Organization',
    label: 'View Organization',
    description: 'Allows the user to view organization details',
    action: 'View',
  },
  'organization:update': {
    module: 'Organization',
    label: 'Edit Organization',
    description: 'Allows the user to edit organization information',
    action: 'Edit',
  },
  'organization:settings': {
    module: 'Organization',
    label: 'Manage Organization Settings',
    description: 'Allows the user to manage organization settings',
    action: 'Edit',
  },

  // Project permissions
  'project:list': {
    module: 'Project',
    label: 'View Projects',
    description: 'Allows the user to view the list of projects',
    action: 'View',
  },
  'project:read': {
    module: 'Project',
    label: 'View Project Details',
    description: 'Allows the user to view individual project details',
    action: 'View',
  },
  'project:create': {
    module: 'Project',
    label: 'Create Projects',
    description: 'Allows the user to create new projects',
    action: 'Create',
  },
  'project:update': {
    module: 'Project',
    label: 'Edit Projects',
    description: 'Allows the user to edit project information',
    action: 'Edit',
  },
  'project:delete': {
    module: 'Project',
    label: 'Delete Projects',
    description: 'Allows the user to delete projects',
    action: 'Delete',
  },
  'project:restore': {
    module: 'Project',
    label: 'Restore Projects',
    description: 'Allows the user to restore deleted projects',
    action: 'Restore',
  },

  // Purchase Order permissions
  'purchase-order:list': {
    module: 'Purchase Order',
    label: 'View Purchase Orders',
    description: 'Allows the user to view the list of purchase orders',
    action: 'View',
  },
  'purchase-order:read': {
    module: 'Purchase Order',
    label: 'View Purchase Order Details',
    description: 'Allows the user to view individual purchase order details',
    action: 'View',
  },
  'purchase-order:create': {
    module: 'Purchase Order',
    label: 'Create Purchase Orders',
    description: 'Allows the user to create new purchase orders',
    action: 'Create',
  },
  'purchase-order:update': {
    module: 'Purchase Order',
    label: 'Edit Purchase Orders',
    description: 'Allows the user to edit purchase order information',
    action: 'Edit',
  },
  'purchase-order:delete': {
    module: 'Purchase Order',
    label: 'Delete Purchase Orders',
    description: 'Allows the user to delete purchase orders',
    action: 'Delete',
  },
  'purchase-order:approve': {
    module: 'Purchase Order',
    label: 'Approve Purchase Orders',
    description: 'Allows the user to approve purchase orders',
    action: 'Approve',
  },

  // Finance permissions
  'finance:list': {
    module: 'Finance',
    label: 'View Finance Records',
    description: 'Allows the user to view the list of finance records',
    action: 'View',
  },
  'finance:read': {
    module: 'Finance',
    label: 'View Finance Details',
    description: 'Allows the user to view individual finance record details',
    action: 'View',
  },
  'finance:create': {
    module: 'Finance',
    label: 'Create Finance Records',
    description: 'Allows the user to create new finance records',
    action: 'Create',
  },
  'finance:update': {
    module: 'Finance',
    label: 'Edit Finance Records',
    description: 'Allows the user to edit finance record information',
    action: 'Edit',
  },
  'finance:delete': {
    module: 'Finance',
    label: 'Delete Finance Records',
    description: 'Allows the user to delete finance records',
    action: 'Delete',
  },
  'finance:approve': {
    module: 'Finance',
    label: 'Approve Finance Records',
    description: 'Allows the user to approve finance records',
    action: 'Approve',
  },

  // Role permissions
  'role:list': {
    module: 'Role',
    label: 'View Roles',
    description: 'Allows the user to view the list of roles',
    action: 'View',
  },
  'role:read': {
    module: 'Role',
    label: 'View Role Details',
    description: 'Allows the user to view individual role details',
    action: 'View',
  },
  'role:create': {
    module: 'Role',
    label: 'Create Roles',
    description: 'Allows the user to create new roles',
    action: 'Create',
  },
  'role:update': {
    module: 'Role',
    label: 'Edit Roles',
    description: 'Allows the user to edit role information',
    action: 'Edit',
  },
  'role:delete': {
    module: 'Role',
    label: 'Delete Roles',
    description: 'Allows the user to delete roles',
    action: 'Delete',
  },
  'role:assign': {
    module: 'Role',
    label: 'Assign Roles',
    description: 'Allows the user to assign roles to users',
    action: 'Edit',
  },

  // System permissions
  'system:settings': {
    module: 'System',
    label: 'Manage System Settings',
    description: 'Allows the user to manage system-wide settings',
    action: 'Edit',
  },
  'system:logs': {
    module: 'System',
    label: 'View System Logs',
    description: 'Allows the user to view system logs',
    action: 'View',
  },
  'system:audit': {
    module: 'System',
    label: 'View Audit Logs',
    description: 'Allows the user to view audit logs',
    action: 'View',
  },
  'system:backup': {
    module: 'System',
    label: 'Manage Backups',
    description: 'Allows the user to manage system backups',
    action: 'Edit',
  },

  // Task permissions
  'task:list': {
    module: 'Task',
    label: 'View Tasks',
    description: 'Allows the user to view the list of tasks',
    action: 'View',
  },
  'task:read': {
    module: 'Task',
    label: 'View Task Details',
    description: 'Allows the user to view individual task details',
    action: 'View',
  },
  'task:create': {
    module: 'Task',
    label: 'Create Tasks',
    description: 'Allows the user to create new tasks',
    action: 'Create',
  },
  'task:update': {
    module: 'Task',
    label: 'Edit Tasks',
    description: 'Allows the user to edit task information',
    action: 'Edit',
  },
  'task:delete': {
    module: 'Task',
    label: 'Delete Tasks',
    description: 'Allows the user to delete tasks',
    action: 'Delete',
  },
  'task:assign': {
    module: 'Task',
    label: 'Assign Tasks',
    description: 'Allows the user to assign tasks to users',
    action: 'Edit',
  },

  // Tracking permissions
  'tracking:view': {
    module: 'Tracking',
    label: 'View Tracking',
    description: 'Allows the user to view tracking information',
    action: 'View',
  },
  'tracking:update': {
    module: 'Tracking',
    label: 'Update Tracking',
    description: 'Allows the user to update tracking information',
    action: 'Edit',
  },

  // User permissions
  'user:list': {
    module: 'User',
    label: 'View Users',
    description: 'Allows the user to view the list of users',
    action: 'View',
  },
  'user:read': {
    module: 'User',
    label: 'View User Details',
    description: 'Allows the user to view individual user details',
    action: 'View',
  },
  'user:create': {
    module: 'User',
    label: 'Create Users',
    description: 'Allows the user to create new users',
    action: 'Create',
  },
  'user:update': {
    module: 'User',
    label: 'Edit Users',
    description: 'Allows the user to edit user information',
    action: 'Edit',
  },
  'user:delete': {
    module: 'User',
    label: 'Delete Users',
    description: 'Allows the user to delete users',
    action: 'Delete',
  },
  'user:activate': {
    module: 'User',
    label: 'Activate Users',
    description: 'Allows the user to activate user accounts',
    action: 'Edit',
  },
  'user:deactivate': {
    module: 'User',
    label: 'Deactivate Users',
    description: 'Allows the user to deactivate user accounts',
    action: 'Edit',
  },

  // Vendor permissions
  'vendor:list': {
    module: 'Vendor',
    label: 'View Vendors',
    description: 'Allows the user to view the list of vendors',
    action: 'View',
  },
  'vendor:read': {
    module: 'Vendor',
    label: 'View Vendor Details',
    description: 'Allows the user to view individual vendor details',
    action: 'View',
  },
  'vendor:create': {
    module: 'Vendor',
    label: 'Create Vendors',
    description: 'Allows the user to create new vendors',
    action: 'Create',
  },
  'vendor:update': {
    module: 'Vendor',
    label: 'Edit Vendors',
    description: 'Allows the user to edit vendor information',
    action: 'Edit',
  },
  'vendor:delete': {
    module: 'Vendor',
    label: 'Delete Vendors',
    description: 'Allows the user to delete vendors',
    action: 'Delete',
  },
};

/**
 * Get human-readable metadata for a permission code
 * Falls back to the permission code itself if not found
 */
export function getPermissionMetadata(permissionCode: string): PermissionMetadata {
  return PERMISSION_METADATA[permissionCode] || {
    module: permissionCode.split(':')[0] || 'Unknown',
    label: permissionCode,
    description: `Permission: ${permissionCode}`,
    action: 'Other',
  };
}

/**
 * Get a consistent display name for a module key
 */
export function getModuleDisplayName(moduleKey: string): string {
  const displayNames: Record<string, string> = {
    'customer': 'Customer',
    'dashboard': 'Dashboard',
    'document': 'Document',
    'finance': 'Finance',
    'inventory': 'Inventory',
    'item-master': 'Item Master',
    'lead': 'Lead',
    'organization': 'Organization',
    'project': 'Project',
    'purchase-order': 'Purchase Order',
    'role': 'Role',
    'system': 'System',
    'task': 'Task',
    'tracking': 'Tracking',
    'user': 'User',
    'vendor': 'Vendor',
  };
  return displayNames[moduleKey] || moduleKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get icon for a permission action
 */
export function getActionIcon(action: PermissionMetadata['action']): string {
  const icons: Record<PermissionMetadata['action'], string> = {
    'View': '👁️',
    'Create': '➕',
    'Edit': '✏️',
    'Delete': '🗑️',
    'Restore': '🔄',
    'Approve': '✅',
    'Other': '⚙️',
  };
  return icons[action] || '⚙️';
}
