'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Shield, Database, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { componentTextSizes } from '@/lib/design-system';

export interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  module: string;
  time: string;
  resolved: boolean;
}

const typeConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, badge: 'destructive' as const },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertCircle, badge: 'warning' as const },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: CheckCircle2, badge: 'secondary' as const },
};

interface SystemAlertsProps {
  alerts: SystemAlert[];
}

export function SystemAlerts({ alerts }: SystemAlertsProps) {
  const critical = alerts.filter((a) => a.type === 'critical' && !a.resolved).length;
  const warnings = alerts.filter((a) => a.type === 'warning' && !a.resolved).length;
  const resolved = alerts.filter((a) => a.resolved).length;

  return (
    <Card className="bg-sa-card border-sa-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            System Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            {critical > 0 && (
              <Badge variant="destructive" className={componentTextSizes.badge}>{critical} Critical</Badge>
            )}
            {warnings > 0 && (
              <Badge variant="warning" className={componentTextSizes.badge}>{warnings} Warning</Badge>
            )}
            {resolved > 0 && (
              <Badge variant="secondary" className={componentTextSizes.badge}>{resolved} Resolved</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-8 w-8 text-green-700 mx-auto mb-2" />
              <p className="text-xs text-sa-text-muted">All systems healthy</p>
            </div>
          ) : (
            alerts.map((alert, index) => {
              const config = typeConfig[alert.type];
              const Icon = config.icon;
              return (
                <div
                  key={`${alert.id}-${index}`}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all',
                    alert.resolved ? 'border-sa-border bg-sa-header-bg opacity-50' : `${config.border} ${config.bg}`,
                  )}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', alert.resolved ? 'text-sa-text-muted' : 'text-sa-text-secondary')}>
                        {alert.title}
                      </span>
                      {alert.resolved && (
                        <Badge variant="secondary" className={cn(componentTextSizes.badge, 'h-4')}>Resolved</Badge>
                      )}
                    </div>
                    <p className="text-xs text-sa-text-muted mt-0.5">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(componentTextSizes.badge, 'text-sa-text-dim')}>{alert.module}</span>
                      <span className={cn(componentTextSizes.badge, 'text-sa-text-dim')}>· {alert.time}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
