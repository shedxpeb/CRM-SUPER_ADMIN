'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Building2, UserPlus, UserCheck, Shield, FileText, FolderKanban,
  Calculator, Package, Database, Settings, LogIn, Zap,
} from 'lucide-react';
import { componentTextSizes } from '@/lib/design-system';

export interface ActivityItem {
  id: string;
  userName: string;
  companyName: string;
  action: string;
  module: string;
  time: string;
}

const moduleIconMap: Record<string, any> = {
  company: Building2,
  owner: Shield,
  admin: UserCheck,
  employee: UserPlus,
  login: LogIn,
  lead: UserPlus,
  project: FolderKanban,
  quotation: FileText,
  estimate: Calculator,
  inventory: Package,
  backup: Database,
  settings: Settings,
  automation: Zap,
};

const actionColorMap: Record<string, string> = {
  created: 'bg-green-500',
  added: 'bg-green-500',
  completed: 'bg-emerald-500',
  updated: 'bg-blue-500',
  sent: 'bg-blue-500',
  login: 'bg-cyan-500',
  deleted: 'bg-red-500',
  failed: 'bg-red-500',
  warning: 'bg-yellow-500',
};

function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  for (const [key, color] of Object.entries(actionColorMap)) {
    if (lower.includes(key)) return color;
  }
  return 'bg-gray-500';
}

interface LiveActivityFeedProps {
  activities: ActivityItem[];
}

export function LiveActivityFeed({ activities }: LiveActivityFeedProps) {
  return (
    <Card className="bg-sa-card border-sa-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <div className="relative">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            Live Activity
          </CardTitle>
          <Badge variant="secondary" className={componentTextSizes.badge}>{activities.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5 max-h-[380px] overflow-y-auto pr-1">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-8 w-8 text-sa-text-dim mx-auto mb-2" />
              <p className="text-xs text-sa-text-muted">No recent activity</p>
            </div>
          ) : (
            activities.map((item, index) => {
              const Icon = moduleIconMap[item.module] || FileText;
              const dotColor = getActionColor(item.action);
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-sa-row-hover transition-colors"
                >
                  <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', dotColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-sa-text-secondary font-medium">{item.userName}</span>
                      <span className={cn(componentTextSizes.badge, 'text-sa-text-muted')}>of</span>
                      <span className={cn(componentTextSizes.badge, 'text-sa-text-muted')}>{item.companyName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icon className="h-3 w-3 text-sa-text-muted" />
                      <span className="text-xs text-sa-text-muted">{item.action}</span>
                      <span className={cn(componentTextSizes.badge, 'text-sa-text-dim')}>· {item.module}</span>
                    </div>
                  </div>
                  <span className={cn(componentTextSizes.badge, 'text-sa-text-muted shrink-0 mt-0.5')}>{item.time}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
