'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminTable, AdminTableColumn, AdminTableFilter } from './AdminTable';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { componentTextSizes } from '@/lib/design-system';

export interface EmployeeRecord {
  id: string;
  name: string;
  company: string;
  role: string;
  lastLogin: string;
  todayActivityCount: number;
  assignedTasks: number;
  completedTasks: number;
  status: string;
}

const columns: AdminTableColumn<EmployeeRecord>[] = [
  { key: 'name', label: 'Employee', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'role', label: 'Role', sortable: true, render: (v) => (
    <Badge variant="secondary" className={componentTextSizes.badge}>{String(v)}</Badge>
  )},
  { key: 'lastLogin', label: 'Last Login', sortable: true },
  { key: 'todayActivityCount', label: 'Today Activity', sortable: true, render: (v) => (
    <span className="text-xs text-sa-text-secondary">{String(v)}</span>
  )},
  { key: 'assignedTasks', label: 'Assigned', sortable: true, render: (v) => (
    <span className="text-xs text-blue-400">{String(v)}</span>
  )},
  { key: 'completedTasks', label: 'Completed', sortable: true, render: (v, row) => {
    const pct = row.assignedTasks > 0 ? Math.round((Number(v) / Number(row.assignedTasks)) * 100) : 0;
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-green-400">{String(v)}</span>
        <span className={cn(componentTextSizes.badge, 'text-sa-text-muted')}>({pct}%)</span>
      </div>
    );
  }},
  { key: 'status', label: 'Status', sortable: true, render: (v) => (
    <Badge variant={v === 'Online' ? 'success' : v === 'Away' ? 'warning' : 'secondary'} className={componentTextSizes.badge}>
      {String(v)}
    </Badge>
  )},
];

interface EmployeeMonitoringProps {
  employees: EmployeeRecord[];
}

export function EmployeeMonitoring({ employees }: EmployeeMonitoringProps) {
  const companies = [...new Set(employees.map((e) => e.company))];
  const roles = [...new Set(employees.map((e) => e.role))];
  const statuses = [...new Set(employees.map((e) => e.status))];

  const filters: AdminTableFilter[] = [
    {
      key: 'company',
      label: 'Company',
      options: companies.map((c) => ({ value: c, label: c })),
    },
    {
      key: 'role',
      label: 'Role',
      options: roles.map((r) => ({ value: r, label: r })),
    },
    {
      key: 'status',
      label: 'Status',
      options: statuses.map((s) => ({ value: s, label: s })),
    },
  ];

  const onlineCount = employees.filter((e) => e.status === 'Online').length;
  const totalActivity = employees.reduce((sum, e) => sum + e.todayActivityCount, 0);

  return (
    <Card className="bg-sa-card border-sa-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Employee Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="success" className={componentTextSizes.badge}>{onlineCount} Online</Badge>
            <Badge variant="secondary" className={componentTextSizes.badge}>{totalActivity} activities today</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AdminTable
          columns={columns as AdminTableColumn<Record<string, any>>[]}
          data={employees}
          filters={filters}
          searchPlaceholder="Search employees..."
          pageSize={6}
          emptyMessage="No employees found"
        />
      </CardContent>
    </Card>
  );
}
