'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminTable, AdminTableColumn, AdminTableFilter } from './AdminTable';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { componentTextSizes } from '@/lib/design-system';

export interface CompanyRecord {
  id: string;
  name: string;
  owner: string;
  employees: number;
  activeProjects: number;
  storageUsage: string;
  storagePct: number;
  subscription: string;
  lastActivity: string;
}

const columns: AdminTableColumn<CompanyRecord>[] = [
  { key: 'name', label: 'Company', sortable: true },
  { key: 'owner', label: 'Owner', sortable: true },
  { key: 'employees', label: 'Employees', sortable: true, render: (v) => (
    <span className="text-xs text-sa-text-secondary">{String(v)}</span>
  )},
  { key: 'activeProjects', label: 'Active Projects', sortable: true, render: (v) => (
    <Badge variant="secondary" className={componentTextSizes.badge}>{String(v)}</Badge>
  )},
  { key: 'storageUsage', label: 'Storage', sortable: true, render: (v, row) => (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-sa-card-solid rounded-full h-1.5">
        <div
          className={cn(
            'h-1.5 rounded-full',
            row.storagePct > 80 ? 'bg-red-500' : row.storagePct > 60 ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${row.storagePct}%` }}
        />
      </div>
      <span className={cn(componentTextSizes.badge, 'text-sa-text-muted')}>{String(v)}</span>
    </div>
  )},
  { key: 'subscription', label: 'Plan', sortable: true, render: (v) => (
    <Badge variant={v === 'Enterprise' ? 'success' : v === 'Professional' ? 'secondary' : 'warning'} className={componentTextSizes.badge}>
      {String(v)}
    </Badge>
  )},
  { key: 'lastActivity', label: 'Last Activity', sortable: true, render: (v) => (
    <span className="text-xs text-sa-text-muted">{String(v)}</span>
  )},
];

interface CompanyMonitoringProps {
  companies: CompanyRecord[];
}

export function CompanyMonitoring({ companies }: CompanyMonitoringProps) {
  const plans = [...new Set(companies.map((c) => c.subscription))];

  const filters: AdminTableFilter[] = [
    {
      key: 'subscription',
      label: 'Plan',
      options: plans.map((p) => ({ value: p, label: p })),
    },
  ];

  const totalEmployees = companies.reduce((s, c) => s + c.employees, 0);
  const totalProjects = companies.reduce((s, c) => s + c.activeProjects, 0);

  return (
    <Card className="bg-sa-card border-sa-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-500" />
            Company Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={componentTextSizes.badge}>{totalEmployees} employees</Badge>
            <Badge variant="secondary" className={componentTextSizes.badge}>{totalProjects} projects</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AdminTable
          columns={columns as AdminTableColumn<Record<string, any>>[]}
          data={companies}
          filters={filters}
          searchPlaceholder="Search companies..."
          pageSize={6}
          emptyMessage="No companies found"
        />
      </CardContent>
    </Card>
  );
}
