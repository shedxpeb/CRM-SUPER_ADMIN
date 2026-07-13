'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AdminKPICard } from '@/features/super-admin/components/AdminKPICard';
import { AdminDetailDialog, DetailColumn } from '@/features/super-admin/components/AdminDetailDialog';
import { LiveActivityFeed, ActivityItem } from '@/features/super-admin/components/LiveActivityFeed';
import { SystemAlerts, SystemAlert } from '@/features/super-admin/components/SystemAlerts';
import { EmployeeMonitoring, EmployeeRecord } from '@/features/super-admin/components/EmployeeMonitoring';
import { CompanyMonitoring, CompanyRecord } from '@/features/super-admin/components/CompanyMonitoring';
import { AnalyticsCharts, ChartDataPoint } from '@/features/super-admin/components/AnalyticsCharts';
import {
  Building2, Users, UserCheck, UserPlus, FolderKanban, CheckCircle2,
  FileText, Package, AlertTriangle, Database, CreditCard, Shield,
  Activity, Server, HardDrive, Clock, ArrowUpRight,
  Zap, Settings,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────

const activityFeedData: ActivityItem[] = [
  { id: '1', userName: 'Rahul Sharma', companyName: 'ABC Construction', action: 'Company created', module: 'company', time: '2 min ago' },
  { id: '2', userName: 'Priya Patel', companyName: 'XYZ Industries', action: 'Owner created', module: 'owner', time: '5 min ago' },
  { id: '3', userName: 'Amit Kumar', companyName: 'ABC Construction', action: 'Admin created', module: 'admin', time: '12 min ago' },
  { id: '4', userName: 'Sneha Reddy', companyName: 'DEF Builders', action: 'Employee created', module: 'employee', time: '18 min ago' },
  { id: '5', userName: 'Vikram Singh', companyName: 'GHI Structures', action: 'Employee login', module: 'login', time: '25 min ago' },
  { id: '6', userName: 'Neha Gupta', companyName: 'MNO Steel Works', action: 'Lead added', module: 'lead', time: '32 min ago' },
  { id: '7', userName: 'Rajesh Kumar', companyName: 'ABC Construction', action: 'Project updated', module: 'project', time: '45 min ago' },
  { id: '8', userName: 'Anita Desai', companyName: 'XYZ Industries', action: 'Quotation created', module: 'quotation', time: '1 hr ago' },
  { id: '9', userName: 'Suresh Patel', companyName: 'DEF Builders', action: 'Estimate sent', module: 'estimate', time: '1.5 hr ago' },
  { id: '10', userName: 'System', companyName: 'Global', action: 'Backup created', module: 'backup', time: '2 hr ago' },
  { id: '11', userName: 'Admin', companyName: 'GHI Structures', action: 'Settings updated', module: 'settings', time: '3 hr ago' },
  { id: '12', userName: 'Kavita Joshi', companyName: 'MNO Steel Works', action: 'Inventory updated', module: 'inventory', time: '3.5 hr ago' },
  { id: '13', userName: 'Deepak Verma', companyName: 'ABC Construction', action: 'Employee login', module: 'login', time: '4 hr ago' },
  { id: '14', userName: 'Pooja Nair', companyName: 'XYZ Industries', action: 'Lead added', module: 'lead', time: '5 hr ago' },
];

const systemAlertsData: SystemAlert[] = [
  { id: '1', type: 'critical', title: 'Backup Failed', description: 'Automated backup for MNO Steel Works failed at 03:00 AM.', module: 'Backup', time: '3 hr ago', resolved: false },
  { id: '2', type: 'warning', title: 'Inactive Company', description: 'JKL Engineering has been inactive for 30+ days.', module: 'Companies', time: '6 hr ago', resolved: false },
  { id: '3', type: 'warning', title: 'Pending Approvals', description: '12 quotations awaiting approval across 3 companies.', module: 'Quotation', time: '8 hr ago', resolved: false },
  { id: '4', type: 'critical', title: 'Permission Issue', description: '5 users in DEF Builders have conflicting role assignments.', module: 'RBAC', time: '12 hr ago', resolved: false },
  { id: '5', type: 'info', title: 'Storage Threshold', description: 'ABC Construction reached 85% storage usage.', module: 'Storage', time: '1 day ago', resolved: false },
  { id: '6', type: 'info', title: 'Backup Restored', description: 'Manual backup for XYZ Industries restored successfully.', module: 'Backup', time: '2 days ago', resolved: true },
];

const employeeMonitoringData: EmployeeRecord[] = [
  { id: 'E001', name: 'Vikram Singh', company: 'GHI Structures', role: 'Admin', lastLogin: '5 min ago', todayActivityCount: 23, assignedTasks: 8, completedTasks: 5, status: 'Online' },
  { id: 'E002', name: 'Sneha Reddy', company: 'DEF Builders', role: 'Employee', lastLogin: '18 min ago', todayActivityCount: 15, assignedTasks: 6, completedTasks: 4, status: 'Online' },
  { id: 'E003', name: 'Neha Gupta', company: 'MNO Steel Works', role: 'Employee', lastLogin: '32 min ago', todayActivityCount: 12, assignedTasks: 10, completedTasks: 7, status: 'Online' },
  { id: 'E004', name: 'Rajesh Kumar', company: 'ABC Construction', role: 'Manager', lastLogin: '1 hr ago', todayActivityCount: 8, assignedTasks: 12, completedTasks: 9, status: 'Away' },
  { id: 'E005', name: 'Anita Desai', company: 'XYZ Industries', role: 'Employee', lastLogin: '2 hr ago', todayActivityCount: 6, assignedTasks: 5, completedTasks: 3, status: 'Away' },
  { id: 'E006', name: 'Suresh Patel', company: 'DEF Builders', role: 'Admin', lastLogin: '3 hr ago', todayActivityCount: 4, assignedTasks: 7, completedTasks: 2, status: 'Offline' },
  { id: 'E007', name: 'Kavita Joshi', company: 'MNO Steel Works', role: 'Employee', lastLogin: '4 hr ago', todayActivityCount: 3, assignedTasks: 4, completedTasks: 4, status: 'Offline' },
  { id: 'E008', name: 'Deepak Verma', company: 'ABC Construction', role: 'Employee', lastLogin: '4 hr ago', todayActivityCount: 9, assignedTasks: 6, completedTasks: 5, status: 'Online' },
  { id: 'E009', name: 'Pooja Nair', company: 'XYZ Industries', role: 'Manager', lastLogin: '5 hr ago', todayActivityCount: 2, assignedTasks: 9, completedTasks: 6, status: 'Offline' },
  { id: 'E010', name: 'Amit Kumar', company: 'ABC Construction', role: 'Admin', lastLogin: '12 min ago', todayActivityCount: 18, assignedTasks: 11, completedTasks: 8, status: 'Online' },
  { id: 'E011', name: 'Manish Tiwari', company: 'GHI Structures', role: 'Employee', lastLogin: '6 hr ago', todayActivityCount: 1, assignedTasks: 3, completedTasks: 1, status: 'Offline' },
  { id: 'E012', name: 'Ritu Agarwal', company: 'MNO Steel Works', role: 'Employee', lastLogin: '1 hr ago', todayActivityCount: 7, assignedTasks: 8, completedTasks: 5, status: 'Online' },
];

const companyMonitoringData: CompanyRecord[] = [
  { id: 'C001', name: 'ABC Construction', owner: 'Rahul Sharma', employees: 12, activeProjects: 5, storageUsage: '4.2 GB', storagePct: 42, subscription: 'Professional', lastActivity: '5 min ago' },
  { id: 'C002', name: 'XYZ Industries', owner: 'Priya Patel', employees: 45, activeProjects: 12, storageUsage: '18.5 GB', storagePct: 62, subscription: 'Enterprise', lastActivity: '15 min ago' },
  { id: 'C003', name: 'DEF Builders', owner: 'Mike Johnson', employees: 3, activeProjects: 1, storageUsage: '0.8 GB', storagePct: 8, subscription: 'Starter', lastActivity: '3 hr ago' },
  { id: 'C004', name: 'GHI Structures', owner: 'Emma Wilson', employees: 18, activeProjects: 7, storageUsage: '8.7 GB', storagePct: 87, subscription: 'Professional', lastActivity: '25 min ago' },
  { id: 'C005', name: 'JKL Engineering', owner: 'Tom Brown', employees: 1, activeProjects: 0, storageUsage: '0.1 GB', storagePct: 1, subscription: 'Free', lastActivity: '30 days ago' },
  { id: 'C006', name: 'MNO Steel Works', owner: 'Lisa Davis', employees: 52, activeProjects: 18, storageUsage: '25.3 GB', storagePct: 84, subscription: 'Enterprise', lastActivity: '2 min ago' },
  { id: 'C007', name: 'PQR Infra', owner: 'Sanjay Mehta', employees: 8, activeProjects: 3, storageUsage: '2.1 GB', storagePct: 21, subscription: 'Professional', lastActivity: '1 hr ago' },
  { id: 'C008', name: 'STU BuildTech', owner: 'Kiran Rao', employees: 22, activeProjects: 9, storageUsage: '12.4 GB', storagePct: 41, subscription: 'Enterprise', lastActivity: '45 min ago' },
];

const analyticsData: ChartDataPoint[] = [
  { month: 'Jan', companies: 8, employees: 45, leads: 120, projects: 15, documents: 89, activity: 234 },
  { month: 'Feb', companies: 12, employees: 62, leads: 145, projects: 22, documents: 112, activity: 278 },
  { month: 'Mar', companies: 15, employees: 78, leads: 180, projects: 28, documents: 156, activity: 345 },
  { month: 'Apr', companies: 18, employees: 95, leads: 210, projects: 35, documents: 189, activity: 412 },
  { month: 'May', companies: 22, employees: 118, leads: 250, projects: 42, documents: 225, activity: 489 },
  { month: 'Jun', companies: 28, employees: 142, leads: 310, projects: 52, documents: 278, activity: 567 },
  { month: 'Jul', companies: 32, employees: 168, leads: 365, projects: 61, documents: 312, activity: 634 },
  { month: 'Aug', companies: 38, employees: 195, leads: 420, projects: 72, documents: 356, activity: 712 },
  { month: 'Sep', companies: 45, employees: 228, leads: 480, projects: 85, documents: 402, activity: 789 },
  { month: 'Oct', companies: 52, employees: 265, leads: 540, projects: 98, documents: 458, activity: 867 },
  { month: 'Nov', companies: 58, employees: 310, leads: 610, projects: 112, documents: 512, activity: 945 },
  { month: 'Dec', companies: 65, employees: 348, leads: 680, projects: 128, documents: 578, activity: 1023 },
];

// ─── Dialog Data ──────────────────────────────────────────────

const dialogCompanyData = [
  { id: 'C001', name: 'ABC Construction', owner: 'Rahul Sharma', plan: 'Professional', status: 'Active', employees: 12, created: '2024-01-15' },
  { id: 'C002', name: 'XYZ Industries', owner: 'Priya Patel', plan: 'Enterprise', status: 'Active', employees: 45, created: '2023-11-20' },
  { id: 'C003', name: 'DEF Builders', owner: 'Mike Johnson', plan: 'Starter', status: 'Trial', employees: 3, created: '2024-03-01' },
  { id: 'C004', name: 'GHI Structures', owner: 'Emma Wilson', plan: 'Professional', status: 'Active', employees: 18, created: '2023-08-10' },
  { id: 'C005', name: 'JKL Engineering', owner: 'Tom Brown', plan: 'Free', status: 'Suspended', employees: 1, created: '2024-02-28' },
  { id: 'C006', name: 'MNO Steel Works', owner: 'Lisa Davis', plan: 'Enterprise', status: 'Active', employees: 52, created: '2023-05-12' },
  { id: 'C007', name: 'PQR Infra', owner: 'Sanjay Mehta', plan: 'Professional', status: 'Active', employees: 8, created: '2024-04-05' },
  { id: 'C008', name: 'STU BuildTech', owner: 'Kiran Rao', plan: 'Enterprise', status: 'Active', employees: 22, created: '2023-09-18' },
];

const dialogOwnerData = [
  { id: 'O001', name: 'Rahul Sharma', email: 'rahul@abc.com', company: 'ABC Construction', status: 'Active', lastLogin: '5 min ago' },
  { id: 'O002', name: 'Priya Patel', email: 'priya@xyz.com', company: 'XYZ Industries', status: 'Active', lastLogin: '15 min ago' },
  { id: 'O003', name: 'Mike Johnson', email: 'mike@def.com', company: 'DEF Builders', status: 'Active', lastLogin: '1 hr ago' },
  { id: 'O004', name: 'Emma Wilson', email: 'emma@ghi.com', company: 'GHI Structures', status: 'Active', lastLogin: '3 hr ago' },
  { id: 'O005', name: 'Tom Brown', email: 'tom@jkl.com', company: 'JKL Engineering', status: 'Inactive', lastLogin: '30 days ago' },
  { id: 'O006', name: 'Lisa Davis', email: 'lisa@mno.com', company: 'MNO Steel Works', status: 'Active', lastLogin: '2 min ago' },
];

const dialogLeadData = [
  { id: 'L001', lead: 'Skyline Tower Project', company: 'ABC Construction', value: '$2.5M', status: 'Qualified', assignedTo: 'Rajesh Kumar' },
  { id: 'L002', lead: 'Warehouse Expansion', company: 'XYZ Industries', value: '$800K', status: 'Proposal', assignedTo: 'Anita Desai' },
  { id: 'L003', lead: 'Factory Shed Renovation', company: 'MNO Steel Works', value: '$1.2M', status: 'Negotiation', assignedTo: 'Neha Gupta' },
  { id: 'L004', lead: 'Office Complex Build', company: 'GHI Structures', value: '$4.1M', status: 'New', assignedTo: 'Vikram Singh' },
  { id: 'L005', lead: 'Bridge Construction', company: 'PQR Infra', value: '$6.8M', status: 'Qualified', assignedTo: 'Manish Tiwari' },
];

const dialogProjectData = [
  { id: 'P001', name: 'Skyline Tower Phase 1', company: 'ABC Construction', status: 'In Progress', progress: '65%', deadline: '2024-08-15' },
  { id: 'P002', name: 'Warehouse Block C', company: 'XYZ Industries', status: 'In Progress', progress: '42%', deadline: '2024-09-20' },
  { id: 'P003', name: 'Factory Shed A', company: 'MNO Steel Works', status: 'Completed', progress: '100%', deadline: '2024-03-01' },
  { id: 'P004', name: 'Office Complex Wing B', company: 'GHI Structures', status: 'In Progress', progress: '28%', deadline: '2024-11-30' },
  { id: 'P005', name: 'Bridge Section 3', company: 'PQR Infra', status: 'Planning', progress: '5%', deadline: '2025-02-28' },
];

const dialogQuotationData = [
  { id: 'Q001', quotation: 'QT-2024-001', company: 'ABC Construction', value: '$125,000', status: 'Pending', validUntil: '2024-04-15' },
  { id: 'Q002', quotation: 'QT-2024-002', company: 'XYZ Industries', value: '$340,000', status: 'Approved', validUntil: '2024-04-20' },
  { id: 'Q003', quotation: 'QT-2024-003', company: 'MNO Steel Works', value: '$89,500', status: 'Pending', validUntil: '2024-04-10' },
  { id: 'Q004', quotation: 'QT-2024-004', company: 'GHI Structures', value: '$210,000', status: 'Rejected', validUntil: '2024-03-25' },
];

const dialogInventoryData = [
  { id: 'I001', item: 'Steel Beams (H-Beam)', warehouse: 'WH-A', stock: 45, minStock: 100, status: 'Low' },
  { id: 'I002', item: 'Roofing Sheets (GI)', warehouse: 'WH-B', stock: 12, minStock: 50, status: 'Critical' },
  { id: 'I003', item: 'Bolts & Nuts (M16)', warehouse: 'WH-A', stock: 500, minStock: 200, status: 'OK' },
  { id: 'I004', item: 'Purlins (Z-Section)', warehouse: 'WH-C', stock: 28, minStock: 80, status: 'Low' },
];

// ─── Column Definitions ───────────────────────────────────────

const companyColumns: DetailColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Company' },
  { key: 'owner', label: 'Owner' },
  { key: 'plan', label: 'Plan' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : v === 'Trial' ? 'warning' : 'destructive'} className="text-[10px]">{String(v)}</Badge> },
  { key: 'employees', label: 'Employees' },
];

const ownerColumns: DetailColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : 'destructive'} className="text-[10px]">{String(v)}</Badge> },
  { key: 'lastLogin', label: 'Last Login' },
];

const leadColumns: DetailColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'lead', label: 'Lead' },
  { key: 'company', label: 'Company' },
  { key: 'value', label: 'Value' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Qualified' ? 'success' : v === 'New' ? 'info' : 'warning'} className="text-[10px]">{String(v)}</Badge> },
  { key: 'assignedTo', label: 'Assigned To' },
];

const projectColumns: DetailColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Project' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Completed' ? 'success' : v === 'In Progress' ? 'warning' : 'secondary'} className="text-[10px]">{String(v)}</Badge> },
  { key: 'progress', label: 'Progress' },
  { key: 'deadline', label: 'Deadline' },
];

const quotationColumns: DetailColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'company', label: 'Company' },
  { key: 'value', label: 'Value' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Approved' ? 'success' : v === 'Pending' ? 'warning' : 'destructive'} className="text-[10px]">{String(v)}</Badge> },
  { key: 'validUntil', label: 'Valid Until' },
];

const inventoryColumns: DetailColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'item', label: 'Item' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'stock', label: 'Stock' },
  { key: 'minStock', label: 'Min Stock' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Critical' ? 'destructive' : v === 'Low' ? 'warning' : 'success'} className="text-[10px]">{String(v)}</Badge> },
];

// ─── Dialog Config ────────────────────────────────────────────

type DialogType = 'companies' | 'owners' | 'employees' | 'leads' | 'projects' | 'completed_projects' | 'quotations' | 'inventory' | 'documents' | null;

function getDialogConfig(type: DialogType) {
  switch (type) {
    case 'companies': return { title: 'All Companies', description: 'Complete list of registered companies', columns: companyColumns, data: dialogCompanyData };
    case 'owners': return { title: 'All Owners', description: 'Company owners across the platform', columns: ownerColumns, data: dialogOwnerData };
    case 'employees': return { title: 'All Employees', description: 'Employee count across all companies', columns: ownerColumns, data: [...dialogOwnerData, ...employeeMonitoringData.map((e) => ({ id: e.id, name: e.name, email: `${e.name.toLowerCase().replace(' ', '.')}@company.com`, company: e.company, status: e.status === 'Online' ? 'Active' : 'Inactive', lastLogin: e.lastLogin }))] };
    case 'leads': return { title: 'All Leads', description: 'Leads across all companies', columns: leadColumns, data: dialogLeadData };
    case 'projects': return { title: 'Active Projects', description: 'Projects currently in progress', columns: projectColumns, data: dialogProjectData.filter((p) => p.status !== 'Completed') };
    case 'completed_projects': return { title: 'Completed Projects', description: 'Successfully delivered projects', columns: projectColumns, data: dialogProjectData.filter((p) => p.status === 'Completed') };
    case 'quotations': return { title: 'Pending Quotations', description: 'Quotations awaiting approval', columns: quotationColumns, data: dialogQuotationData.filter((q) => q.status === 'Pending') };
    case 'inventory': return { title: 'Inventory Alerts', description: 'Items below minimum stock levels', columns: inventoryColumns, data: dialogInventoryData };
    case 'documents': return { title: 'Documents Generated', description: 'All documents across companies', columns: [{ key: 'id', label: 'ID' }, { key: 'type', label: 'Type' }, { key: 'title', label: 'Title' }, { key: 'company', label: 'Company' }, { key: 'created', label: 'Created' }], data: [{ id: 'D001', type: 'Estimate', title: 'Skyline Tower Cost Estimate', company: 'ABC Construction', created: '2024-03-28' }, { id: 'D002', type: 'Proposal', title: 'Warehouse Expansion Proposal', company: 'XYZ Industries', created: '2024-03-27' }, { id: 'D003', type: 'Quotation', title: 'QT-2024-001', company: 'ABC Construction', created: '2024-03-26' }, { id: 'D004', type: 'BOQ', title: 'Bridge Section BOQ', company: 'PQR Infra', created: '2024-03-25' }] };
    default: return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const dialogConfig = getDialogConfig(activeDialog);

  const systemStatus = [
    { label: 'API Server', status: 'Operational', icon: Server, color: 'text-green-500' },
    { label: 'Database', status: 'Operational', icon: HardDrive, color: 'text-green-500' },
    { label: 'Background Jobs', status: 'Operational', icon: Clock, color: 'text-green-500' },
    { label: 'Email Service', status: 'Degraded', icon: AlertTriangle, color: 'text-yellow-500' },
  ];

  const quickActions = [
    { label: 'Create Company', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/super-admin/companies' },
    { label: 'Create Owner', icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10', href: '/super-admin/users' },
    { label: 'Manage Users', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', href: '/super-admin/users' },
    { label: 'Subscriptions', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10', href: '/super-admin/subscriptions' },
    { label: 'Backup', icon: Database, color: 'text-cyan-500', bg: 'bg-cyan-500/10', href: '/super-admin/backup' },
    { label: 'Audit Logs', icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10', href: '/super-admin/audit-logs' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sa-text">System Overview</h1>
        <p className="text-sm text-sa-text-muted mt-0.5">Complete system-wide activity, monitoring, and analytics</p>
      </div>

      {/* ═══ KPI Summary Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        <AdminKPICard title="Total Companies" value={156} change={8} icon={<Building2 className="h-5 w-5" />} color="text-blue-500" onClick={() => setActiveDialog('companies')} />
        <AdminKPICard title="Active Companies" value={142} change={5} icon={<CheckCircle2 className="h-5 w-5" />} color="text-green-500" onClick={() => setActiveDialog('companies')} />
        <AdminKPICard title="Total Owners" value={65} change={12} icon={<UserCheck className="h-5 w-5" />} color="text-emerald-500" onClick={() => setActiveDialog('owners')} />
        <AdminKPICard title="Total Employees" value={348} change={15} icon={<Users className="h-5 w-5" />} color="text-purple-500" onClick={() => setActiveDialog('employees')} />
        <AdminKPICard title="New Employees Today" value={7} change={2} icon={<UserPlus className="h-5 w-5" />} color="text-cyan-500" />
        <AdminKPICard title="Total Leads" value={680} change={22} icon={<Activity className="h-5 w-5" />} color="text-yellow-500" onClick={() => setActiveDialog('leads')} />
        <AdminKPICard title="Active Projects" value={128} change={8} icon={<FolderKanban className="h-5 w-5" />} color="text-orange-500" onClick={() => setActiveDialog('projects')} />
        <AdminKPICard title="Completed Projects" value={42} change={15} icon={<CheckCircle2 className="h-5 w-5" />} color="text-green-500" onClick={() => setActiveDialog('completed_projects')} />
        <AdminKPICard title="Pending Quotations" value={12} change={-3} icon={<FileText className="h-5 w-5" />} color="text-red-500" onClick={() => setActiveDialog('quotations')} />
        <AdminKPICard title="Inventory Alerts" value={4} change={1} icon={<Package className="h-5 w-5" />} color="text-yellow-500" onClick={() => setActiveDialog('inventory')} />
        <AdminKPICard title="Documents Generated" value={578} change={18} icon={<FileText className="h-5 w-5" />} color="text-cyan-500" onClick={() => setActiveDialog('documents')} />
        <AdminKPICard title="Backup Status" value="Healthy" change={0} icon={<Database className="h-5 w-5" />} color="text-green-500" />
      </div>

      {/* ═══ Live Activity + System Alerts + System Status ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveActivityFeed activities={activityFeedData} />
        </div>
        <div className="space-y-4">
          <SystemAlerts alerts={systemAlertsData} />

          {/* System Health Mini */}
          <Card className="bg-sa-card border-sa-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-sa-text-muted flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {systemStatus.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={`${item.label}-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-3.5 w-3.5', item.color)} />
                      <span className="text-xs text-sa-text-secondary">{item.label}</span>
                    </div>
                    <Badge variant={item.status === 'Operational' ? 'success' : 'warning'} className="text-[9px]">
                      {item.status}
                    </Badge>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-sa-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sa-text-muted">DB Storage</span>
                  <span className="text-[11px] text-sa-text-secondary">42.8 / 100 GB</span>
                </div>
                <div className="w-full bg-sa-input rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '42.8%' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sa-text-muted">API Calls Today</span>
                  <span className="text-[11px] text-sa-text-secondary">12,847 / 50,000</span>
                </div>
                <div className="w-full bg-sa-input rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '25.7%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ Employee Monitoring ═══ */}
      <EmployeeMonitoring employees={employeeMonitoringData} />

      {/* ═══ Company Monitoring ═══ */}
      <CompanyMonitoring companies={companyMonitoringData} />

      {/* ═══ Analytics ═══ */}
      <AnalyticsCharts data={analyticsData} />

      {/* ═══ Quick Actions ═══ */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-sa-text-muted flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-sa-border bg-sa-chart-bg hover:bg-sa-card-hover hover:border-sa-border-solid transition-all cursor-pointer group">
                    <div className={cn('p-2.5 rounded-xl', action.bg)}>
                      <Icon className={cn('h-5 w-5', action.color)} />
                    </div>
                    <span className="text-xs text-sa-text-muted group-hover:text-sa-text transition-colors text-center">{action.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Detail Dialog ═══ */}
      {dialogConfig && (
        <AdminDetailDialog
          open={!!activeDialog}
          onClose={() => setActiveDialog(null)}
          title={dialogConfig.title}
          description={dialogConfig.description}
          columns={dialogConfig.columns}
          data={dialogConfig.data}
        />
      )}
    </div>
  );
}
