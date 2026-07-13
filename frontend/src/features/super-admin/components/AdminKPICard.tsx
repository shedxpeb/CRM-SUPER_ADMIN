'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { componentTextSizes } from '@/lib/design-system';

interface AdminKPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: ReactNode;
  color: string;
  onClick?: () => void;
}

export const AdminKPICard = memo(function AdminKPICard({
  title,
  value,
  change,
  icon,
  color,
  onClick,
}: AdminKPICardProps) {
  const bgMap: Record<string, string> = {
    'text-blue-500': 'bg-blue-500/10',
    'text-green-500': 'bg-green-500/10',
    'text-purple-500': 'bg-purple-500/10',
    'text-red-500': 'bg-red-500/10',
    'text-orange-500': 'bg-orange-500/10',
    'text-cyan-500': 'bg-cyan-500/10',
    'text-yellow-500': 'bg-yellow-500/10',
    'text-emerald-500': 'bg-emerald-500/10',
    'text-pink-500': 'bg-pink-500/10',
    'text-indigo-500': 'bg-indigo-500/10',
  };

  const iconBg = bgMap[color] || 'bg-sa-border/50';

  return (
    <div className="transition-all duration-150 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]">
      <Card
        className="bg-sa-card border-sa-border cursor-pointer transition-all duration-200 hover:border-sa-border-solid hover:bg-sa-card-hover"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={cn(componentTextSizes.kpiCard.label, 'font-medium text-sa-text-muted uppercase tracking-wider mb-1')}>{title}</p>
              <p className={cn(componentTextSizes.kpiCard.value, 'font-bold text-sa-text mb-1.5')}>{value}</p>
              <Badge
                variant={change > 0 ? 'success' : change < 0 ? 'destructive' : 'secondary'}
                className={cn(componentTextSizes.badge, 'px-1.5 py-0')}
              >
                {change > 0 ? '+' : ''}{change}%
              </Badge>
            </div>
            <div className={cn('p-2 rounded-lg shrink-0', iconBg)}>
              <div className={`${color} h-4 w-4 flex items-center justify-center`}>{icon}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
