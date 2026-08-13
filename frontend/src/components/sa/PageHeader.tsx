'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { componentTextSizes } from '@/lib/design-system';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className={cn(componentTextSizes.pageHeader.title, 'font-bold', 'text-sa-text')}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn(componentTextSizes.pageHeader.subtitle, 'mt-1', 'text-sa-text-muted')}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-sa-border-solid border-t-sa-accent animate-spin" />
      <p className="text-xs text-sa-text-muted">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="rounded-xl p-6 text-center border"
      style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}
    >
      <p className="text-sm text-red-400 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--sa-accent)', color: 'white' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No records found' }: { message?: string }) {
  return (
    <div
      className="rounded-xl p-10 text-center border border-dashed"
      style={{ borderColor: 'var(--sa-border-solid)', background: 'var(--sa-card)' }}
    >
      <p className="text-sm text-sa-text-muted">{message}</p>
    </div>
  );
}
