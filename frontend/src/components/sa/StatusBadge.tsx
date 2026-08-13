'use client';

import { Badge } from '@/components/ui/badge';
import { titleCase } from '@/lib/format';

const STATUS_VARIANT: Record<string, string> = {
  ACTIVE: 'success',
  TRIAL: 'info',
  TRIALING: 'info',
  SUSPENDED: 'warning',
  BLOCKED: 'destructive',
  CANCELLED: 'destructive',
  CANCELED: 'destructive',
  LOCKED: 'destructive',
  INACTIVE: 'secondary',
  DRAFT: 'secondary',
  SCHEDULED: 'info',
  PUBLISHED: 'success',
  EXPIRED: 'secondary',
  QUEUED: 'info',
  RUNNING: 'info',
  COMPLETED: 'success',
  PROCESSED: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  SENT: 'success',
  SYNCED: 'success',
  SYNCING: 'info',
  UNKNOWN: 'warning',
  REVOKED: 'secondary',
  OK: 'success',
  UP: 'success',
  DOWN: 'destructive',
};

const LEVEL_VARIANT: Record<string, string> = {
  INFO: 'info',
  DEBUG: 'secondary',
  WARN: 'warning',
  WARNING: 'warning',
  ERROR: 'destructive',
  FATAL: 'destructive',
  ALERT: 'destructive',
  SUCCESS: 'success',
};

export function StatusBadge({ status }: { status: string }) {
  const value = (status || 'UNKNOWN').toUpperCase();
  const variant = STATUS_VARIANT[value] || (value === 'SUCCESS' ? 'success' : 'secondary');
  return (
    <Badge variant={variant as 'success' | 'secondary' | 'info' | 'warning' | 'destructive'}>
      {titleCase(value)}
    </Badge>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const value = (level || 'INFO').toUpperCase();
  const variant = LEVEL_VARIANT[value] || 'secondary';
  return (
    <Badge variant={variant as 'success' | 'secondary' | 'info' | 'warning' | 'destructive'}>
      {value}
    </Badge>
  );
}

export function BooleanBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return <Badge variant={value ? 'success' : 'secondary'}>{value ? trueLabel : falseLabel}</Badge>;
}
