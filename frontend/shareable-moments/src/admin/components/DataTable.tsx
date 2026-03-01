import React, { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Settings2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  hideable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<T> {
  tableId: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  onRowClick?: (row: T) => void;
  bulkActions?: { label: string; onClick: (selected: T[]) => void; destructive?: boolean }[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  getRowId: (row: T) => string;
  pageSize?: number;
}

function DataTable<T>({
  tableId, columns, data, loading, searchPlaceholder = 'Search...', filters = [],
  onRowClick, bulkActions = [], emptyMessage = 'No data found', emptyIcon, getRowId, pageSize = 25,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(pageSize);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`shyara_admin_cols_${tableId}`);
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set(columns.map(c => c.key));
  });

  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); } else next.add(key);
      localStorage.setItem(`shyara_admin_cols_${tableId}`, JSON.stringify([...next]));
      return next;
    });
  };

  const activeColumns = useMemo(() => columns.filter(c => visibleCols.has(c.key)), [columns, visibleCols]);

  const activeFilterCount = useMemo(() => Object.values(filterValues).filter(v => v && v !== '__all__').length, [filterValues]);

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row => {
        return columns.some(col => {
          const val = (row as any)[col.key];
          return val && String(val).toLowerCase().includes(q);
        });
      });
    }
    Object.entries(filterValues).forEach(([key, val]) => {
      if (val && val !== '__all__') {
        result = result.filter(row => String((row as any)[key]) === val);
      }
    });
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortKey]; const bv = (b as any)[sortKey];
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, filterValues, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const pageData = filteredData.slice(page * perPage, (page + 1) * perPage);

  const toggleSort = (key: string) => {
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortDir('asc'); }
  };

  const allSelected = pageData.length > 0 && pageData.every(r => selectedIds.has(getRowId(r)));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageData.map(r => getRowId(r))));
  };

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportCsv = useCallback(() => {
    const headers = activeColumns.map(c => c.label).join(',');
    const rows = filteredData.map(r => activeColumns.map(c => JSON.stringify(String((r as any)[c.key] ?? ''))).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${tableId}-export.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [activeColumns, filteredData, tableId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2"><Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-32" /></div>
        <div className="border border-border rounded-lg overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 border-b border-border last:border-0">
              {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder={searchPlaceholder} className="pl-9 h-9" />
        </div>
        {filters.map(f => (
          <Select key={f.key} value={filterValues[f.key] || '__all__'} onValueChange={v => { setFilterValues(p => ({ ...p, [f.key]: v })); setPage(0); }}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder={f.label} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All {f.label}</SelectItem>
              {f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Filter className="h-3 w-3" /> {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </Badge>
        )}
        <div className="flex-1" />
        <Popover>
          <PopoverTrigger asChild><Button variant="outline" size="sm"><Settings2 className="h-4 w-4" /></Button></PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Columns</p>
            {columns.filter(c => c.hideable !== false).map(c => (
              <label key={c.key} className="flex items-center gap-2 px-1 py-1 hover:bg-muted rounded cursor-pointer text-sm">
                <Checkbox checked={visibleCols.has(c.key)} onCheckedChange={() => toggleCol(c.key)} />
                {c.label}
              </label>
            ))}
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> CSV</Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {bulkActions.length > 0 && (
                <th className="w-10 px-3 py-2"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
              )}
              {activeColumns.map(col => (
                <th key={col.key} className={cn('px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap', col.sortable && 'cursor-pointer select-none hover:text-foreground', col.className)} onClick={() => col.sortable && toggleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={activeColumns.length + (bulkActions.length > 0 ? 1 : 0)} className="text-center py-12 text-muted-foreground">
                {emptyIcon && <div className="mb-2 flex justify-center">{emptyIcon}</div>}
                {emptyMessage}
              </td></tr>
            ) : pageData.map(row => {
              const id = getRowId(row);
              return (
                <tr key={id} className={cn('border-b border-border last:border-0 hover:bg-muted/30 transition-colors group', onRowClick && 'cursor-pointer')} onClick={() => onRowClick?.(row)}>
                  {bulkActions.length > 0 && (
                    <td className="w-10 px-3 py-2" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(id)} onCheckedChange={() => toggleRow(id)} />
                    </td>
                  )}
                  {activeColumns.map(col => (
                    <td key={col.key} className={cn('px-3 py-2 text-foreground', col.className)}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky bulk action bar */}
      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-card border border-border rounded-lg p-3 flex items-center gap-3 shadow-lg z-10">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <div className="flex-1" />
          {bulkActions.map(a => (
            <Button key={a.label} size="sm" variant={a.destructive ? 'destructive' : 'outline'} onClick={() => a.onClick(data.filter(r => selectedIds.has(getRowId(r))))}>
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filteredData.length} result{filteredData.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[70px] h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(0)}><ChevronsLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3 w-3" /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}><ChevronsRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
