'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Eye,
  Copy,
  LayoutDashboard,
  UserCircle,
  FolderKanban,
  Package,
  Zap,
  Calculator,
  FileStack,
  FileText,
  Settings,
  DatabaseBackup,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Layers,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────

type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'assign' | 'submit';

interface SubFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface ModuleDef {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  subFeatures: SubFeature[];
  enabled: boolean;
}

interface RolePermissions {
  modules: Record<string, boolean>;
  actions: Record<string, ActionType[]>;
  subFeatures: Record<string, Record<string, boolean>>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  company: string;
  status: string;
  lastLogin: string;
}

// ─── Module Definitions ───────────────────────────────────────────

const moduleDefinitions: ModuleDef[] = [
  { id: 'dashboard', name: 'Dashboard', category: 'OVERVIEW', description: 'Central overview of KPIs, alerts, and activity.', icon: LayoutDashboard, enabled: true, subFeatures: [
    { id: 'kpi_cards', name: 'KPI Cards', description: 'Summary metric cards at top.', enabled: true },
    { id: 'smart_alerts', name: 'Smart Alerts', description: 'SLA & critical alert panel.', enabled: true },
    { id: 'activity_feed', name: 'Activity Feed', description: 'Live activity stream on dashboard.', enabled: true },
  ]},
  { id: 'leads', name: 'CRM & Sales', category: 'PIPELINE', description: 'Lead management, follow-ups, and sales pipeline.', icon: UserCircle, enabled: true, subFeatures: [
    { id: 'lead_list', name: 'Lead List', description: 'View and manage all leads.', enabled: true },
    { id: 'kanban_view', name: 'Kanban View', description: 'Drag-and-drop pipeline board.', enabled: true },
    { id: 'ai_scoring', name: 'AI Lead Scoring', description: 'Automated lead quality scoring.', enabled: true },
  ]},
  { id: 'survey', name: 'Survey', category: 'FIELD', description: 'Site surveys and field data collection.', icon: FileText, enabled: true, subFeatures: [
    { id: 'survey_forms', name: 'Survey Forms', description: 'Create and fill survey forms.', enabled: true },
  ]},
  { id: 'design', name: 'Design & BOQ', category: 'FIELD', description: 'Structural design and bill of quantities.', icon: Calculator, enabled: true, subFeatures: [
    { id: 'design_calc', name: 'Design Calculator', description: 'Engineering calculations.', enabled: true },
    { id: 'boq_gen', name: 'BOQ Generator', description: 'Auto-generate bill of quantities.', enabled: true },
  ]},
  { id: 'quotation', name: 'Quotation', category: 'FINANCE', description: 'Create and manage price quotations.', icon: FileText, enabled: true, subFeatures: [
    { id: 'quote_list', name: 'Quotation List', description: 'All quotations overview.', enabled: true },
    { id: 'quote_templates', name: 'Templates', description: 'Quotation templates.', enabled: true },
  ]},
  { id: 'projects', name: 'Projects', category: 'OPERATIONS', description: 'Project lifecycle and milestone tracking.', icon: FolderKanban, enabled: true, subFeatures: [
    { id: 'project_list', name: 'Project List', description: 'View all projects.', enabled: true },
    { id: 'gantt', name: 'Gantt Chart', description: 'Timeline and scheduling.', enabled: true },
    { id: 'milestones', name: 'Milestones', description: 'Project milestones tracking.', enabled: true },
  ]},
  { id: 'inventory', name: 'Inventory', category: 'OPERATIONS', description: 'Stock tracking, warehouses, and material management.', icon: Package, enabled: true, subFeatures: [
    { id: 'stock_view', name: 'Stock Overview', description: 'Current stock levels.', enabled: true },
    { id: 'low_alerts', name: 'Low Stock Alerts', description: 'Automatic reorder alerts.', enabled: true },
  ]},
  { id: 'documents', name: 'Documents', category: 'OPERATIONS', description: 'Document storage, estimates, proposals.', icon: FileStack, enabled: true, subFeatures: [
    { id: 'estimates', name: 'Estimates', description: 'Cost estimate documents.', enabled: true },
    { id: 'proposals', name: 'Proposals', description: 'Project proposals.', enabled: true },
  ]},
  { id: 'automation', name: 'Automation', category: 'SYSTEM', description: 'Workflow rules, triggers, and task automation.', icon: Zap, enabled: true, subFeatures: [
    { id: 'workflows', name: 'Workflows', description: 'Automated workflow rules.', enabled: true },
    { id: 'triggers', name: 'Triggers', description: 'Event-based triggers.', enabled: true },
  ]},
  { id: 'settings', name: 'Settings', category: 'SYSTEM', description: 'System configuration and preferences.', icon: Settings, enabled: true, subFeatures: [
    { id: 'general', name: 'General', description: 'App-wide settings.', enabled: true },
    { id: 'team', name: 'Team Management', description: 'Team and roles config.', enabled: true },
  ]},
];

const ALL_ACTIONS: ActionType[] = ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'submit'];

const ACTION_LABELS: Record<ActionType, string> = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
  export: 'Export', approve: 'Approve', assign: 'Assign', submit: 'Submit',
};

// ─── Default Roles ────────────────────────────────────────────────

function fullPermissions(): RolePermissions {
  const mods: Record<string, boolean> = {};
  const acts: Record<string, ActionType[]> = {};
  const subs: Record<string, Record<string, boolean>> = {};
  moduleDefinitions.forEach((m) => {
    mods[m.id] = true;
    acts[m.id] = [...ALL_ACTIONS];
    subs[m.id] = {};
    m.subFeatures.forEach((sf) => { subs[m.id][sf.id] = true; });
  });
  return { modules: mods, actions: acts, subFeatures: subs };
}

function noPermissions(): RolePermissions {
  const mods: Record<string, boolean> = {};
  const acts: Record<string, ActionType[]> = {};
  const subs: Record<string, Record<string, boolean>> = {};
  moduleDefinitions.forEach((m) => {
    mods[m.id] = false;
    acts[m.id] = [];
    subs[m.id] = {};
    m.subFeatures.forEach((sf) => { subs[m.id][sf.id] = false; });
  });
  return { modules: mods, actions: acts, subFeatures: subs };
}

function viewOnlyPermissions(): RolePermissions {
  const mods: Record<string, boolean> = {};
  const acts: Record<string, ActionType[]> = {};
  const subs: Record<string, Record<string, boolean>> = {};
  moduleDefinitions.forEach((m) => {
    mods[m.id] = true;
    acts[m.id] = ['view'];
    subs[m.id] = {};
    m.subFeatures.forEach((sf) => { subs[m.id][sf.id] = true; });
  });
  return { modules: mods, actions: acts, subFeatures: subs };
}

const defaultRoles: Role[] = [
  { id: 'super_admin', name: 'Super Admin', description: 'Full system access. Can manage all tenants and settings.', isSystem: true, permissions: fullPermissions() },
  { id: 'owner', name: 'Owner', description: 'Full company access. Can manage company settings and users.', isSystem: true, permissions: fullPermissions() },
  { id: 'admin', name: 'Admin', description: 'Manage most modules. Cannot change billing or delete company.', isSystem: true, permissions: fullPermissions() },
  { id: 'manager', name: 'Manager', description: 'View, create, edit across assigned modules.', isSystem: false, permissions: (() => { const p = fullPermissions(); p.actions.settings = ['view' as ActionType]; p.modules.backup = false; return p; })() },
  { id: 'employee', name: 'Employee', description: 'Basic view and create access for assigned modules.', isSystem: false, permissions: viewOnlyPermissions() },
];

const initialUsers: UserRecord[] = [
  { id: 'U001', name: 'John Smith', email: 'john@abc.com', roleIds: ['owner'], company: 'ABC Construction', status: 'Active', lastLogin: '2 min ago' },
  { id: 'U002', name: 'Sarah Lee', email: 'sarah@xyz.com', roleIds: ['owner'], company: 'XYZ Industries', status: 'Active', lastLogin: '15 min ago' },
  { id: 'U003', name: 'Mike Johnson', email: 'mike@def.com', roleIds: ['admin'], company: 'DEF Builders', status: 'Active', lastLogin: '1 hr ago' },
  { id: 'U004', name: 'Emma Wilson', email: 'emma@ghi.com', roleIds: ['manager'], company: 'GHI Structures', status: 'Active', lastLogin: '3 hr ago' },
  { id: 'U005', name: 'Tom Brown', email: 'tom@jkl.com', roleIds: ['employee'], company: 'JKL Engineering', status: 'Inactive', lastLogin: '30 days ago' },
  { id: 'U006', name: 'Lisa Davis', email: 'lisa@mno.com', roleIds: ['owner'], company: 'MNO Steel Works', status: 'Active', lastLogin: '5 min ago' },
];

// ─── Toggle Component ─────────────────────────────────────────────

function Toggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
        enabled ? 'bg-orange-500' : 'bg-sa-border-solid',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform', enabled ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

type TabId = 'modules' | 'rbac_matrix' | 'role_builder' | 'user_perms';

const tabs: { id: TabId; label: string; icon: any }[] = [
  { id: 'modules', label: 'Modules', icon: Layers },
  { id: 'rbac_matrix', label: 'RBAC Matrix', icon: Shield },
  { id: 'role_builder', label: 'Role Builder', icon: Lock },
  { id: 'user_perms', label: 'User Perms', icon: Users },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('modules');
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);

  // Modules tab
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [selectedRoleForModules, setSelectedRoleForModules] = useState('manager');
  const [moduleSearch, setModuleSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Role Builder
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [cloneFrom, setCloneFrom] = useState('employee');
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<string | null>(null);

  // User Perms
  const [userSearch, setUserSearch] = useState('');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', company: '', roleIds: ['employee'], status: 'Active' });
  const [userPermDialogOpen, setUserPermDialogOpen] = useState(false);
  const [permEditUser, setPermEditUser] = useState<UserRecord | null>(null);

  // ── Helpers ──

  const getRole = (id: string) => roles.find((r) => r.id === id);
  const getRoleName = (ids: string[]) => ids.map((id) => getRole(id)?.name || id).join(', ');

  const customRoles = roles.filter((r) => !r.isSystem);
  const systemRoles = roles.filter((r) => r.isSystem);

  // ── Module Tab Logic ──

  const activePermissions = getRole(selectedRoleForModules)?.permissions || noPermissions();

  const toggleModuleAccess = (roleId: string, moduleId: string) => {
    setRoles(roles.map((r) => {
      if (r.id !== roleId) return r;
      if (r.isSystem) return r;
      const newVal = !r.permissions.modules[moduleId];
      const currentActions: ActionType[] = r.permissions.actions[moduleId] || [];
      const newActions: ActionType[] = newVal ? (currentActions.length > 0 ? currentActions : ['view']) : [];
      const newSubs: Record<string, boolean> = {};
      if (newVal) {
        const modDef = moduleDefinitions.find((m) => m.id === moduleId);
        modDef?.subFeatures.forEach((sf) => { newSubs[sf.id] = true; });
      } else {
        const modDef = moduleDefinitions.find((m) => m.id === moduleId);
        modDef?.subFeatures.forEach((sf) => { newSubs[sf.id] = false; });
      }
      return {
        ...r,
        permissions: {
          ...r.permissions,
          modules: { ...r.permissions.modules, [moduleId]: newVal },
          actions: { ...r.permissions.actions, [moduleId]: newActions },
          subFeatures: { ...r.permissions.subFeatures, [moduleId]: newSubs },
        },
      };
    }));
  };

  const toggleSubFeature = (roleId: string, moduleId: string, sfId: string) => {
    setRoles(roles.map((r) => {
      if (r.id !== roleId) return r;
      if (r.isSystem) return r;
      const current = r.permissions.subFeatures[moduleId] || {};
      return {
        ...r,
        permissions: {
          ...r.permissions,
          subFeatures: {
            ...r.permissions.subFeatures,
            [moduleId]: { ...current, [sfId]: !current[sfId] },
          },
        },
      };
    }));
  };

  const toggleAction = (roleId: string, moduleId: string, action: ActionType) => {
    setRoles(roles.map((r) => {
      if (r.id !== roleId) return r;
      if (r.isSystem) return r;
      const current: ActionType[] = r.permissions.actions[moduleId] || [];
      const newActions: ActionType[] = current.includes(action) ? current.filter((a) => a !== action) : [...current, action];
      return {
        ...r,
        permissions: {
          ...r.permissions,
          actions: { ...r.permissions.actions, [moduleId]: newActions },
        },
      };
    }));
  };

  const filteredModules = moduleDefinitions.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(moduleSearch.toLowerCase()) || m.description.toLowerCase().includes(moduleSearch.toLowerCase());
    const matchCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // ── Role Builder Logic ──

  const handleCreateRole = () => {
    const sourcePerms = getRole(cloneFrom)?.permissions || noPermissions();
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: newRoleName,
      description: newRoleDesc,
      isSystem: false,
      permissions: JSON.parse(JSON.stringify(sourcePerms)),
    };
    setRoles([...roles, newRole]);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleDialogOpen(false);
    setSelectedRoleForEdit(newRole.id);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter((r) => r.id !== roleId));
    if (selectedRoleForEdit === roleId) setSelectedRoleForEdit(null);
  };

  // ── User Perms Logic ──

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', company: '', roleIds: ['employee'], status: 'Active' });
    setAddUserDialogOpen(true);
  };

  const openEditUser = (user: UserRecord) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, company: user.company, roleIds: [...user.roleIds], status: user.status });
    setAddUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map((u) => u.id === editingUser.id ? { ...u, ...userForm } : u));
    } else {
      setUsers([...users, { id: `U${String(users.length + 1).padStart(3, '0')}`, ...userForm, lastLogin: 'Never' }]);
    }
    setAddUserDialogOpen(false);
  };

  const handleDeleteUser = () => {
    if (deletingUser) setUsers(users.filter((u) => u.id !== deletingUser.id));
    setDeleteDialogOpen(false);
  };

  const toggleUserRole = (roleId: string) => {
    const current = userForm.roleIds;
    setUserForm({ ...userForm, roleIds: current.includes(roleId) ? current.filter((r) => r !== roleId) : [...current, roleId] });
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.company.toLowerCase().includes(userSearch.toLowerCase())
  );

  const activeCount = moduleDefinitions.filter((m) => activePermissions.modules[m.id]).length;

  // ── Render ──

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sa-text">Settings & Control Center</h1>
        <p className="text-sm text-sa-text-muted mt-0.5">Manage modules, roles, permissions, and user access</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto bg-sa-card-solid rounded-lg p-1 border border-sa-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2',
                activeTab === tab.id ? 'bg-orange-500/20 text-orange-400' : 'text-sa-text-muted hover:text-sa-text-secondary hover:bg-sa-row-hover'
              )}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════ MODULES TAB ═══════════ */}
      {activeTab === 'modules' && (
        <Card className="bg-sa-card border-sa-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
                  <Layers className="h-4 w-4 text-orange-500" />
                  Modules Control
                  <Badge variant="secondary" className="text-[10px]">{activeCount}/{moduleDefinitions.length} active</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-sa-text-muted mt-1">Toggle entire modules and their sub-features.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-sa-text-muted">Viewing as:</span>
                <Select value={selectedRoleForModules} onValueChange={setSelectedRoleForModules}>
                  <SelectTrigger className="w-[160px] bg-sa-input border-sa-border text-sa-text h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-sa-card-solid border-sa-border">
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search + Category Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-text-muted" />
                <Input placeholder="Search modules or features..." value={moduleSearch} onChange={(e) => setModuleSearch(e.target.value)} className="pl-9 bg-sa-input border-sa-border text-sa-text placeholder:text-sa-text-muted h-8 text-sm" />
              </div>
              <div className="flex gap-1">
                {['all', 'OVERVIEW', 'PIPELINE', 'OPERATIONS', 'FIELD', 'FINANCE', 'SYSTEM'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                      categoryFilter === cat ? 'bg-orange-500/20 text-orange-400' : 'text-sa-text-muted hover:text-sa-text-secondary'
                    )}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Cards */}
            <div className="space-y-3">
              {filteredModules.map((mod) => {
                const Icon = mod.icon;
                const isEnabled = activePermissions.modules[mod.id];
                const modActions = activePermissions.actions[mod.id] || [];
                const subFeats = activePermissions.subFeatures[mod.id] || {};
                const enabledSubCount = mod.subFeatures.filter((sf) => subFeats[sf.id]).length;
                const isExpanded = expandedModule === mod.id;

                return (
                  <div key={mod.id} className={cn('rounded-lg border transition-all', isEnabled ? 'border-sa-border-solid bg-sa-input' : 'border-sa-border bg-sa-header-bg opacity-60')}>
                    {/* Module Header */}
                    <div className="flex items-center gap-3 p-4">
                      <div className={cn('p-2 rounded-lg', isEnabled ? 'bg-orange-500/10' : 'bg-sa-card-solid')}>
                        <Icon className={cn('h-5 w-5', isEnabled ? 'text-orange-500' : 'text-sa-text-muted')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium', isEnabled ? 'text-sa-text' : 'text-sa-text-muted')}>{mod.name}</span>
                          <Badge variant="secondary" className="text-[9px] h-4">{mod.category}</Badge>
                          <span className="text-[11px] text-sa-text-muted">{enabledSubCount}/{mod.subFeatures.length} features</span>
                        </div>
                        <p className="text-xs text-sa-text-muted truncate">{mod.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Toggle enabled={isEnabled} onToggle={() => toggleModuleAccess(selectedRoleForModules, mod.id)} />
                        <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} className="p-1 text-sa-text-muted hover:text-sa-text transition-colors">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded: Sub-Features + Actions */}
                    {isExpanded && isEnabled && (
                      <div className="px-4 pb-4 pt-0 border-t border-sa-border">
                        {/* Sub-Features */}
                        <div className="mt-3 space-y-2">
                          <p className="text-[11px] text-sa-text-muted font-medium uppercase tracking-wider">Sub-Features</p>
                          {mod.subFeatures.map((sf) => (
                            <div key={sf.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-sa-input">
                              <div>
                                <span className="text-xs text-sa-text-secondary">{sf.name}</span>
                                <p className="text-[10px] text-sa-text-muted">{sf.description}</p>
                              </div>
                              <Toggle enabled={!!subFeats[sf.id]} onToggle={() => toggleSubFeature(selectedRoleForModules, mod.id, sf.id)} />
                            </div>
                          ))}
                        </div>

                        {/* Allowed Actions */}
                        <div className="mt-4">
                          <p className="text-[11px] text-sa-text-muted font-medium uppercase tracking-wider mb-2">Allowed Actions</p>
                          <div className="flex flex-wrap gap-2">
                            {ALL_ACTIONS.map((action) => {
                              const isActive = modActions.includes(action);
                              return (
                                <button
                                  key={action}
                                  onClick={() => toggleAction(selectedRoleForModules, mod.id, action)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
                                    isActive
                                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                      : 'bg-sa-input border-sa-border-solid text-sa-text-muted hover:border-sa-border hover:text-sa-text-secondary'
                                  )}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                    {ACTION_LABELS[action]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ RBAC MATRIX TAB ═══════════ */}
      {activeTab === 'rbac_matrix' && (
        <Card className="bg-sa-card border-sa-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  Role & Permissions Matrix
                </CardTitle>
                <CardDescription className="text-xs text-sa-text-muted">Toggle module access per role. Click a cell to enable/disable.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-[10px] text-sa-text-muted">Enabled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                  <span className="text-[10px] text-sa-text-muted">Disabled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-sa-text-muted" />
                  <span className="text-[10px] text-sa-text-muted">System (read-only)</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-10 w-10 text-sa-text-dim mx-auto mb-3" />
                <p className="text-sm text-sa-text-muted">No custom roles found in DB. Create one in Role Builder.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-sa-border hover:bg-transparent">
                      <TableHead className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider sticky left-0 bg-sa-card-solid z-10 min-w-[160px]">Module</TableHead>
                      {roles.map((role) => (
                        <TableHead key={role.id} className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider text-center min-w-[110px]">
                          <div className="flex flex-col items-center">
                            <span className={cn(role.isSystem ? 'text-sa-text-muted' : 'text-orange-400')}>{role.name}</span>
                            {role.isSystem && (
                              <span className="flex items-center gap-1 text-[9px] text-sa-text-dim normal-case mt-0.5">
                                <Lock className="h-2.5 w-2.5" /> System
                              </span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moduleDefinitions.map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <TableRow key={mod.id} className="border-sa-border hover:bg-sa-card-hover/20">
                          <TableCell className="text-sm text-sa-text-secondary font-medium sticky left-0 bg-sa-card-solid z-10">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-sa-text-muted" />
                              <div>
                                <span>{mod.name}</span>
                                <Badge variant="secondary" className="text-[8px] h-3 ml-1.5 px-1">{mod.category}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          {roles.map((role) => {
                            const hasAccess = role.permissions.modules[mod.id];
                            const actions = role.permissions.actions[mod.id] || [];
                            return (
                              <TableCell key={role.id} className="text-center">
                                <div className="flex items-center justify-center py-1">
                                  <Toggle
                                    enabled={hasAccess}
                                    onToggle={() => toggleModuleAccess(role.id, mod.id)}
                                    disabled={role.isSystem}
                                  />
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ ROLE BUILDER TAB ═══════════ */}
      {activeTab === 'role_builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Role List */}
          <Card className="bg-sa-card border-sa-border lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-500" />
                    Role Builder
                  </CardTitle>
                  <CardDescription className="text-xs text-sa-text-muted mt-1">{customRoles.length} custom roles</CardDescription>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover h-7 text-xs gap-1" onClick={() => { setCloneFrom('employee'); setNewRoleDialogOpen(true); }}>
                    <Copy className="h-3 w-3" /> Clone
                  </Button>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 h-7 text-xs gap-1" onClick={() => { setNewRoleName(''); setNewRoleDesc(''); setCloneFrom('employee'); setNewRoleDialogOpen(true); }}>
                    <Plus className="h-3 w-3" /> New Role
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-[10px] text-sa-text-muted uppercase tracking-wider mb-2">System Roles</p>
              {systemRoles.map((role) => (
                <div
                  key={role.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all cursor-pointer',
                    selectedRoleForEdit === role.id ? 'border-orange-500/40 bg-orange-500/5' : 'border-sa-border bg-sa-chart-bg hover:border-sa-border-solid'
                  )}
                  onClick={() => setSelectedRoleForEdit(role.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-sa-text-secondary font-medium">{role.name}</span>
                    <Badge variant="secondary" className="text-[9px]">System</Badge>
                  </div>
                  <p className="text-[11px] text-sa-text-muted mt-0.5">{role.description}</p>
                </div>
              ))}

              {customRoles.length > 0 && (
                <>
                  <p className="text-[10px] text-sa-text-muted uppercase tracking-wider mb-2 mt-4">Custom Roles</p>
                  {customRoles.map((role) => (
                    <div
                      key={role.id}
                      className={cn(
                        'p-3 rounded-lg border transition-all cursor-pointer group',
                        selectedRoleForEdit === role.id ? 'border-orange-500/40 bg-orange-500/5' : 'border-sa-border bg-sa-chart-bg hover:border-sa-border-solid'
                      )}
                      onClick={() => setSelectedRoleForEdit(role.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-400 font-medium">{role.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-sa-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-[11px] text-sa-text-muted mt-0.5">{role.description}</p>
                    </div>
                  ))}
                </>
              )}

              {customRoles.length === 0 && (
                <div className="text-center py-6 mt-2">
                  <Layers className="h-8 w-8 text-gray-800 mx-auto mb-2" />
                  <p className="text-xs text-sa-text-muted">No custom roles yet. Click &quot;+ New Role&quot; to create one.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Permission Editor */}
          <Card className="bg-sa-card border-sa-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-sa-text-secondary">Permission Editor</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRoleForEdit ? (() => {
                const role = getRole(selectedRoleForEdit);
                if (!role) return <p className="text-sm text-sa-text-muted">Role not found.</p>;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-sa-border">
                      <div className={cn('p-2 rounded-lg', role.isSystem ? 'bg-sa-card-solid' : 'bg-orange-500/10')}>
                        <Lock className={cn('h-5 w-5', role.isSystem ? 'text-sa-text-muted' : 'text-orange-500')} />
                      </div>
                      <div>
                        <h3 className={cn('text-lg font-bold', role.isSystem ? 'text-sa-text-secondary' : 'text-orange-400')}>{role.name}</h3>
                        <p className="text-xs text-sa-text-muted">{role.description}</p>
                        {role.isSystem && <p className="text-[10px] text-yellow-600 mt-0.5">System role - permissions are read-only</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {moduleDefinitions.map((mod) => {
                        const Icon = mod.icon;
                        const hasAccess = role.permissions.modules[mod.id];
                        const actions = role.permissions.actions[mod.id] || [];
                        const subFeats = role.permissions.subFeatures[mod.id] || {};
                        const enabledSubCount = mod.subFeatures.filter((sf) => subFeats[sf.id]).length;

                        return (
                          <div key={mod.id} className={cn('p-3 rounded-lg border', hasAccess ? 'border-sa-border-solid bg-sa-chart-bg' : 'border-sa-border bg-sa-header-bg')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className={cn('h-4 w-4', hasAccess ? 'text-sa-text-secondary' : 'text-sa-text-dim')} />
                                <span className={cn('text-sm font-medium', hasAccess ? 'text-sa-text-secondary' : 'text-sa-text-muted')}>{mod.name}</span>
                                <Badge variant="secondary" className="text-[9px] h-4">{mod.category}</Badge>
                                {hasAccess && <span className="text-[10px] text-sa-text-muted">{enabledSubCount}/{mod.subFeatures.length} features, {actions.length} actions</span>}
                              </div>
                              <Toggle enabled={hasAccess} onToggle={() => toggleModuleAccess(role.id, mod.id)} disabled={role.isSystem} />
                            </div>
                            {hasAccess && (
                              <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                                {ALL_ACTIONS.map((action) => {
                                  const isActive = actions.includes(action);
                                  return (
                                    <button
                                      key={action}
                                      onClick={role.isSystem ? undefined : () => toggleAction(role.id, mod.id, action)}
                                      className={cn(
                                        'px-2 py-0.5 rounded text-[10px] font-medium transition-all border',
                                        isActive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-sa-input border-sa-border-solid text-sa-text-dim',
                                        role.isSystem && 'cursor-default'
                                      )}
                                    >
                                      {ACTION_LABELS[action]}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-12 border-2 border-dashed border-sa-border rounded-lg">
                  <Lock className="h-10 w-10 text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-sa-text-muted">Select a custom role to edit its permissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════ USER PERMS TAB ═══════════ */}
      {activeTab === 'user_perms' && (
        <>
          <div className="flex items-center justify-between">
            <Card className="bg-sa-card border-sa-border flex-1">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-text-muted" />
                    <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 bg-sa-input border-sa-border text-sa-text placeholder:text-sa-text-muted h-9" />
                  </div>
                  <span className="text-xs text-sa-text-muted">{filteredUsers.length} users</span>
                </div>
              </CardContent>
            </Card>
            <Button onClick={openAddUser} className="bg-orange-600 hover:bg-orange-700 gap-2 h-9 ml-3">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>

          <Card className="bg-sa-card border-sa-border">
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-sa-border hover:bg-transparent">
                      {['User', 'Assigned Roles', 'Company', 'Status', 'Last Login', 'Actions'].map((h) => (
                        <TableHead key={h} className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-sa-border hover:bg-sa-row-hover">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-sa-text text-xs font-bold">
                              {user.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-sa-text">{user.name}</p>
                              <p className="text-[11px] text-sa-text-muted">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roleIds.map((rid) => {
                              const role = getRole(rid);
                              return role ? (
                                <Badge key={rid} variant={role.isSystem ? 'secondary' : 'info'} className="text-[10px]">
                                  {role.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-sa-text-secondary">{user.company}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'Active' ? 'success' : 'destructive'} className="text-[10px]">{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-sa-text-muted">{user.lastLogin}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover" onClick={() => { setPermEditUser(user); setUserPermDialogOpen(true); }} title="Edit Permissions">
                              <Shield className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover" onClick={() => openEditUser(user)} title="Edit User">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-red-400 hover:bg-sa-card-hover" onClick={() => { setDeletingUser(user); setDeleteDialogOpen(true); }} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════ DIALOGS ═══════════ */}

      {/* New Role Dialog */}
      <Dialog open={newRoleDialogOpen} onOpenChange={setNewRoleDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sa-text">Create New Role</DialogTitle>
            <DialogDescription className="text-sa-text-muted">Define a new role. You can clone permissions from an existing role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Role Name</label>
              <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Finance Manager" className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Description</label>
              <Input value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="What this role can do" className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Clone Permissions From</label>
              <Select value={cloneFrom} onValueChange={setCloneFrom}>
                <SelectTrigger className="bg-sa-input border-sa-border text-sa-text h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-sa-card-solid border-sa-border">
                  {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewRoleDialogOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()} className="bg-orange-600 hover:bg-orange-700">Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sa-text">{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription className="text-sa-text-muted">{editingUser ? 'Update user details and role assignment' : 'Create a new user and assign roles'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-sa-text-muted mb-1 block">Full Name</label>
                <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-sa-text-muted mb-1 block">Email</label>
                <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-sa-text-muted mb-1 block">Company</label>
                <Input value={userForm.company} onChange={(e) => setUserForm({ ...userForm, company: e.target.value })} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-sa-text-muted mb-1 block">Status</label>
                <Select value={userForm.status} onValueChange={(v) => setUserForm({ ...userForm, status: v })}>
                  <SelectTrigger className="bg-sa-input border-sa-border text-sa-text h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-sa-card-solid border-sa-border"><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-2 block">Assign Roles (click to toggle)</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const isSelected = userForm.roleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => toggleUserRole(role.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
                        isSelected
                          ? role.isSystem ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-sa-input border-sa-border-solid text-sa-text-muted hover:border-sa-border'
                      )}
                    >
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddUserDialogOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Permission Detail Dialog */}
      <Dialog open={userPermDialogOpen} onOpenChange={setUserPermDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sa-text flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              {permEditUser?.name} - Permissions
            </DialogTitle>
            <DialogDescription className="text-sa-text-muted">
              Effective permissions from assigned roles: {permEditUser ? getRoleName(permEditUser.roleIds) : ''}
            </DialogDescription>
          </DialogHeader>
          {permEditUser && (
            <div className="space-y-3 mt-2">
              {moduleDefinitions.map((mod) => {
                const Icon = mod.icon;
                // Merge permissions from all assigned roles
                const anyAccess = permEditUser.roleIds.some((rid) => {
                  const role = getRole(rid);
                  return role?.permissions.modules[mod.id];
                });
                const mergedActions = new Set<ActionType>();
                const mergedSubs: Record<string, boolean> = {};
                permEditUser.roleIds.forEach((rid) => {
                  const role = getRole(rid);
                  if (!role) return;
                  (role.permissions.actions[mod.id] || []).forEach((a) => mergedActions.add(a));
                  const subs = role.permissions.subFeatures[mod.id] || {};
                  Object.entries(subs).forEach(([k, v]) => { if (v) mergedSubs[k] = true; });
                });

                return (
                  <div key={mod.id} className={cn('p-3 rounded-lg border', anyAccess ? 'border-sa-border-solid bg-sa-chart-bg' : 'border-sa-border opacity-50')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', anyAccess ? 'text-sa-text-secondary' : 'text-sa-text-dim')} />
                        <span className={cn('text-sm font-medium', anyAccess ? 'text-sa-text-secondary' : 'text-sa-text-muted')}>{mod.name}</span>
                        <Badge variant="secondary" className="text-[9px] h-4">{mod.category}</Badge>
                      </div>
                      <div className={cn('w-2 h-2 rounded-full', anyAccess ? 'bg-green-500' : 'bg-gray-700')} />
                    </div>
                    {anyAccess && (
                      <div className="mt-2 ml-6 flex flex-wrap gap-1.5">
                        {ALL_ACTIONS.map((action) => {
                          const isActive = mergedActions.has(action);
                          return (
                            <span key={action} className={cn('px-2 py-0.5 rounded text-[10px] font-medium border', isActive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-sa-input border-sa-border-solid text-sa-text-dim')}>
                              {ACTION_LABELS[action]}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sa-text">Delete User</DialogTitle>
            <DialogDescription className="text-sa-text-muted">Are you sure you want to delete &quot;{deletingUser?.name}&quot;?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
