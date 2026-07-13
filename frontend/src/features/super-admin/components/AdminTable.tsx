'use client';

import { useState, useMemo, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminTableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface AdminTableFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface AdminTableProps<T extends Record<string, any>> {
  columns: AdminTableColumn<T>[];
  data: T[];
  filters?: AdminTableFilter[];
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

type SortDir = 'asc' | 'desc' | null;

export const AdminTable = memo(function AdminTable<T extends Record<string, any>>({
  columns,
  data,
  filters = [],
  searchPlaceholder = 'Search...',
  pageSize = 8,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
}: AdminTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...data];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => row[col.key]?.toString().toLowerCase().includes(q))
      );
    }

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter((row) => row[key]?.toString() === value);
      }
    });

    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, activeFilters, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  
  // Memoize paginated data to prevent unnecessary re-renders
  const paginated = useMemo(() => 
    filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3 w-3 text-sa-text-dim" />;
    if (sortDir === 'asc') return <ArrowUp className="h-3 w-3 text-sa-accent" />;
    return <ArrowDown className="h-3 w-3 text-sa-accent" />;
  };

  return (
    <div className="space-y-3">
      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-text-muted" />
          <Input
            placeholder={searchPlaceholder}
            value={search || ''}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-sa-input border-sa-border text-sa-text placeholder:text-sa-text-muted h-8 text-sm"
          />
        </div>
        {filters.map((f) => (
          <Select
            key={f.key}
            value={activeFilters[f.key] || 'all'}
            onValueChange={(v) => {
              setActiveFilters((prev) => ({ ...prev, [f.key]: v }));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] bg-sa-input border-sa-border text-sa-text h-8 text-xs">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent className="bg-sa-card-solid border-sa-border">
              <SelectItem value="all">{f.label}</SelectItem>
              {f.options.map((o, index) => (
                <SelectItem key={`${o.value}-${index}`} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-sa-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-sa-border hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-sa-text-secondary'
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-sa-border">
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <Loader2 className="h-6 w-6 text-sa-text-muted animate-spin mx-auto mb-2" />
                  <p className="text-sm text-sa-text-muted">Loading...</p>
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow className="border-sa-border">
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <Inbox className="h-8 w-8 text-sa-text-dim mx-auto mb-2" />
                  <p className="text-sm text-sa-text-muted">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, idx) => (
                <TableRow
                  key={`${row.id || row.email || idx}`}
                  className={cn(
                    'border-sa-border hover:bg-sa-row-hover',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-sa-text-secondary text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-sa-text-muted">
          Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-border/50"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <span key={`page-${p}`} className="flex items-center">
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span className="text-sa-text-dim text-xs px-1">...</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 text-xs',
                    page === p ? 'bg-sa-accent/20 text-sa-accent' : 'text-sa-text-muted hover:text-sa-text hover:bg-sa-border/50'
                  )}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              </span>
            ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-border/50"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
