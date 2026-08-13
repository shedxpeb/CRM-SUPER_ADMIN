'use client';

import { useEffect, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState, ErrorState } from './PageHeader';

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  getRowClassName?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyMessage,
  getRowClassName,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isError) {
    return <ErrorState message={errorMessage || 'Failed to load data'} onRetry={onRetry} />;
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} style={{ borderColor: 'var(--sa-border)' }}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs font-semibold uppercase tracking-wider text-sa-text-muted"
                >
                  {header.isPlaceholder ? null : (
                    <button
                      className={cn(
                        'flex items-center gap-1 select-none',
                        header.column.getCanSort() ? 'cursor-pointer hover:text-sa-text' : '',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-sa-text-dim">
                          {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
                          {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
                          {!header.column.getIsSorted() && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                        </span>
                      )}
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow style={{ borderColor: 'var(--sa-border)' }}>
              <TableCell colSpan={columns.length} className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" style={{ background: 'var(--sa-border)' }} />
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow style={{ borderColor: 'var(--sa-border)' }}>
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState message={emptyMessage} />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn('hover:bg-sa-row-hover', getRowClassName?.(row.original))}
                style={{ borderColor: 'var(--sa-border)' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-sa-text-secondary">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const [input, setInput] = useState(String(page));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => setInput(String(page)), [page]);

  if (total === 0) return null;

  const goto = (p: number) => {
    const clamped = Math.min(totalPages, Math.max(1, p));
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--sa-border)' }}>
      <p className="text-xs text-sa-text-muted">
        {total === 0 ? '0 results' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goto(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{ background: 'var(--sa-card-solid)', color: 'var(--sa-text-secondary)' }}
        >
          Prev
        </button>
        <span className="text-xs text-sa-text-muted">
          Page{' '}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
            onBlur={() => goto(Number(input) || 1)}
            onKeyDown={(e) => e.key === 'Enter' && goto(Number(input) || 1)}
            className="w-12 px-1.5 py-1 text-center rounded-lg text-xs outline-none"
            style={{ background: 'var(--sa-input)', border: '1px solid var(--sa-border)', color: 'var(--sa-text)' }}
          />{' '}
          of {totalPages}
        </span>
        <button
          onClick={() => goto(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{ background: 'var(--sa-card-solid)', color: 'var(--sa-text-secondary)' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
