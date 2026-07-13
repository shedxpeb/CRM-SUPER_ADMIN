'use client';

import { useSAThemeStore, SATheme } from '@/store/useSAThemeStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes: { value: SATheme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'sky', label: 'Sky Blue', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useSAThemeStore();

  return (
    <div className="flex items-center gap-0.5 bg-sa-border/30 rounded-lg p-0.5">
      {themes.map(({ value, label, icon: Icon }, index) => (
        <button
          key={`${value}-${index}`}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            'p-1.5 rounded-md transition-all duration-200',
            theme === value
              ? 'bg-sa-accent text-white shadow-sm'
              : 'text-sa-text-muted hover:text-sa-text-secondary hover:bg-sa-border/50'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
