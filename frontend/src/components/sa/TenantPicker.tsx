'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Search } from 'lucide-react';
import { PageHeader } from '@/components/sa/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/sa/StatusBadge';
import { useTenants } from '@/lib/queries';
import { LoadingState, ErrorState } from '@/components/sa/PageHeader';
import { timeAgo, truncate } from '@/lib/format';

export default function TenantPicker({
  title,
  subtitle,
  tab,
}: {
  title: string;
  subtitle: string;
  tab: string;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useTenants({
    page: 1,
    pageSize: 50,
    q: search || undefined,
  });

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="flex-1 max-w-md mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-text-muted" />
          <Input
            placeholder="Search tenants…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchInput);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading tenants…" />
      ) : isError ? (
        <ErrorState message="Failed to load tenants" onRetry={refetch} />
      ) : (data?.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-sa-text-muted py-8 text-center">No tenants match your search</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data!.data.map((tenant) => (
            <Card
              key={tenant.id}
              className="bg-sa-card border-sa-border cursor-pointer transition-all hover:border-sa-border-solid hover:bg-sa-card-hover group"
            >
              <CardContent
                className="p-4"
                onClick={() => router.push(`/super-admin/tenants/${tenant.id}?tab=${tab}`)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sa-border-solid to-sa-card-solid flex items-center justify-center shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-sa-text-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-sa-text truncate">{tenant.name}</p>
                      <p className="text-xs text-sa-text-dim truncate">{truncate(tenant.domain ?? tenant.slug, 30)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={tenant.status} />
                    <ArrowRight className="h-3.5 w-3.5 text-sa-text-dim group-hover:text-sa-accent transition-colors" />
                  </div>
                </div>
                <p className="text-xs text-sa-text-muted mt-2">Last activity {timeAgo(tenant.updatedAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
