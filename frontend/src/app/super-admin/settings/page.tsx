'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader, LoadingState, ErrorState } from '@/components/sa/PageHeader';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/lib/queries';
import { titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Save, Eye, EyeOff, Check } from 'lucide-react';
import type { PlatformSetting } from '@/lib/types';
import { RouteGuard } from '@/features/auth/RouteGuard';

function SettingEditor({ setting }: { setting: PlatformSetting }) {
  const update = useUpdatePlatformSetting();
  const [value, setValue] = useState<string>(formatValue(setting));
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  function formatValue(s: PlatformSetting): string {
    if (s.value === null || s.value === undefined) return '';
    if (typeof s.value === 'boolean') return String(s.value);
    if (typeof s.value === 'object') return JSON.stringify(s.value);
    return String(s.value);
  }

  const save = async () => {
    let parsed: unknown = value;
    if (setting.type === 'BOOLEAN') parsed = value === 'true';
    else if (setting.type === 'NUMBER') parsed = Number(value);
    else if (setting.type === 'JSON') {
      try {
        parsed = JSON.parse(value);
      } catch {
        return;
      }
    }
    await update.mutateAsync({ key: setting.key, input: { value: parsed } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isBoolean = setting.type === 'BOOLEAN';
  const isSecret = setting.isSecret || setting.type === 'SECRET';
  const masked = isSecret && !showSecret && value.length > 0 ? '•'.repeat(12) : value;

  return (
    <div className="py-3 border-b border-sa-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-sa-text-secondary">{titleCase(setting.key.replace(/[._-]+/g, ' '))}</p>
          {setting.description && <p className="text-xs text-sa-text-muted mt-0.5">{setting.description}</p>}
          <p className="text-[10px] text-sa-text-dim mt-1 font-mono">{setting.key}</p>
        </div>
        {isBoolean ? (
          <div className="flex items-center gap-3 shrink-0">
            {saved && <Check className="h-4 w-4 text-green-500" />}
            <button
              onClick={() => {
                setValue(value === 'true' ? 'false' : 'true');
                setTimeout(() => update.mutateAsync({ key: setting.key, input: { value: value !== 'true' } }), 0);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                value === 'true' ? 'bg-blue-600' : 'bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                  value === 'true' ? 'translate-x-[18px]' : 'translate-x-[3px]'
                )}
              />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto sm:max-w-[380px]">
            <div className="relative flex-1">
              <Input
                value={masked}
                readOnly={isSecret && !showSecret}
                onChange={(e) => setValue(e.target.value)}
                type={setting.type === 'NUMBER' ? 'number' : 'text'}
                className="font-mono text-xs h-8"
              />
              {isSecret && (
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sa-text-muted hover:text-sa-text"
                >
                  {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            {saved ? (
              <Check className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <Button variant="ghost" size="sm" className="h-8 px-2" disabled={update.isPending} onClick={save}>
                <Save className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const settings = usePlatformSettings({ page: 1, pageSize: 500 });
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    const list = settings.data?.data ?? [];
    const filtered = list.filter((s) => s.key.toLowerCase().includes(search.toLowerCase()));
    const map = new Map<string, PlatformSetting[]>();
    for (const s of filtered) {
      const cat = s.category || 'general';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [settings.data, search]);

  if (settings.isLoading) return <LoadingState label="Loading settings…" />;
  if (settings.isError) return <ErrorState message="Failed to load settings" onRetry={settings.refetch} />;

  return (
    <RouteGuard requiredPermission="settings:read">
      <div>
        <PageHeader title="System Settings" subtitle="Platform-wide configuration managed centrally" />
        <div className="max-w-md mb-6">
          <Input placeholder="Search settings…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

      {groups.length === 0 ? (
        <p className="text-sm text-sa-text-muted py-8 text-center">No settings match your search</p>
      ) : (
        <div className="space-y-6">
          {groups.map(([category, items]) => (
            <Card key={category} className="bg-sa-card border-sa-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-sa-text-muted uppercase tracking-wider">
                  {titleCase(category)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {items.map((s) => (
                  <SettingEditor key={s.id} setting={s} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
