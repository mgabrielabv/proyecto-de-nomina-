import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { tableContainerVariants, tableRowVariants } from '../../../animations/variants';
import { cn } from '../../../utils';

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  sortValue?: (row: T) => string | number;
  hideOnMobile?: boolean;
}

export interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  selectedKeys?: string[];
  onToggleRow?: (key: string) => void;
  onToggleAll?: () => void;
  loading?: boolean;
  emptyMessage?: string;
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

function RowSkeleton({ columns }: { columns: number }) {
  return (
    <tr className="border-b border-border">
      <td colSpan={columns} className="px-5 py-6">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: Math.min(columns, 5) }, (_, index) => (
            <span key={index} className="h-4 flex-1 animate-pulse rounded-md bg-surface-soft" />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function ResponsiveTable<T>(props: ResponsiveTableProps<T>) {
  const {
    columns,
    rows,
    rowKey,
    caption,
    sortKey,
    sortDirection,
    onSort,
    onRowClick,
    selectedKeys,
    onToggleRow,
    onToggleAll,
    loading = false,
    emptyMessage = 'Sin resultados.',
  } = props;

  const selectable = Boolean(selectedKeys && onToggleRow);
  const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedKeys?.includes(rowKey(row)));
  const someSelected = selectable && rows.some((row) => selectedKeys?.includes(rowKey(row)));
  const totalColumns = columns.length + (selectable ? 1 : 0);

  return (
    <div className="glass-card overflow-hidden">
      <div className="hidden md:block">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
              <tr className="border-b border-border">
                {selectable && (
                  <th scope="col" className="w-12 px-5 py-3.5">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todas las filas"
                      checked={allSelected}
                      ref={(node) => {
                        if (node) node.indeterminate = !allSelected && someSelected;
                      }}
                      onChange={onToggleAll}
                      className="h-4 w-4 rounded border-border-strong accent-[var(--color-accent)]"
                    />
                  </th>
                )}
                {columns.map((column) => {
                  const active = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={cn(
                        'px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-text-muted',
                        alignClasses[column.align ?? 'left'],
                      )}
                    >
                      {onSort && column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => onSort(column.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded transition-colors duration-200 hover:text-text',
                            active && 'text-text',
                          )}
                        >
                          {column.header}
                          {active &&
                            (sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                            ))}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <motion.tbody variants={tableContainerVariants} initial="hidden" animate="show">
              <AnimatePresence initial={false}>
                {loading && <RowSkeleton columns={totalColumns} />}
                {!loading && rows.length === 0 && (
                  <tr className="border-b border-border">
                    <td colSpan={totalColumns} className="px-5 py-14 text-center text-sm text-text-secondary">
                      <Search className="mx-auto mb-3 h-6 w-6 text-text-muted" aria-hidden />
                      {emptyMessage}
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((row) => {
                    const key = rowKey(row);
                    const selected = selectedKeys?.includes(key) ?? false;
                    return (
                      <motion.tr
                        key={key}
                        variants={tableRowVariants}
                        exit="exit"
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(
                          'border-b border-border transition-colors duration-150 last:border-b-0',
                          onRowClick && 'cursor-pointer hover:bg-spot',
                          selected && 'bg-spot',
                        )}
                      >
                        {selectable && (
                          <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Seleccionar fila ${key}`}
                              checked={selected}
                              onChange={() => onToggleRow?.(key)}
                              className="h-4 w-4 rounded border-border-strong accent-[var(--color-accent)]"
                            />
                          </td>
                        )}
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn('px-5 py-4 align-middle text-text-secondary', alignClasses[column.align ?? 'left'])}
                          >
                            {column.render(row)}
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden">
        <motion.ul variants={tableContainerVariants} initial="hidden" animate="show" className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {loading &&
              Array.from({ length: 3 }, (_, index) => (
                <li key={index} className="space-y-2.5 p-5">
                  {Array.from({ length: 3 }, (_, inner) => (
                    <span key={inner} className="block h-4 animate-pulse rounded-md bg-surface-soft" />
                  ))}
                </li>
              ))}
            {!loading && rows.length === 0 && (
              <li className="p-8 text-center text-sm text-text-secondary">{emptyMessage}</li>
            )}
            {!loading &&
              rows.map((row) => {
                const key = rowKey(row);
                return (
                  <motion.li
                    key={key}
                    variants={tableRowVariants}
                    exit="exit"
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('space-y-2.5 p-5', onRowClick && 'cursor-pointer active:bg-spot')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2.5">
                        {columns
                          .filter((column) => !column.hideOnMobile)
                          .map((column) => (
                            <div key={column.key} className="flex items-baseline justify-between gap-4">
                              <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-text-muted">
                                {column.header}
                              </span>
                              <span className="truncate text-right text-sm text-text">{column.render(row)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  );
}
