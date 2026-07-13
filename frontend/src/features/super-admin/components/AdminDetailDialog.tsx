'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Search } from 'lucide-react';

export interface DetailColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface AdminDetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  columns: DetailColumn[];
  data: Record<string, unknown>[];
}

export function AdminDetailDialog({
  open,
  onClose,
  title,
  description,
  columns,
  data,
}: AdminDetailDialogProps) {
  const [search, setSearch] = useState('');

  const filteredData = data.filter((row) =>
    columns.some((col) =>
      row[col.key]?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-sa-card-solid/95 border-sa-border text-sa-text backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sa-text text-lg">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sa-text-muted">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-1">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-text-muted" />
            <Input
              placeholder="Search..."
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-sa-input border-sa-border text-sa-text placeholder:text-sa-text-muted h-9 text-sm"
            />
          </div>

          <div className="rounded-lg border border-sa-border overflow-auto max-h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow className="border-sa-border hover:bg-transparent">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow className="border-sa-border">
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-sa-text-muted py-8 text-sm"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, idx) => (
                    <TableRow
                      key={`${row.id || row.email || idx}`}
                      className="border-sa-border hover:bg-sa-row-hover"
                    >
                      {columns.map((col) => (
                        <TableCell key={col.key} className="text-sa-text-secondary text-sm">
                          {col.render ? col.render(row[col.key], row) : (row[col.key] as React.ReactNode)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-sa-text-muted">{filteredData.length} record(s)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
