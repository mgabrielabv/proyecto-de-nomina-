import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { tableContainerVariants, tableRowVariants } from '../../../animations/variants';
import { cn } from '../../../utils';
import { EmptyState } from '../EmptyState';

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
  emptyTitle?: string;
  emptyAction?: ReactNode;
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

function SkeletonRows({ columns, rows = 6 }: { columns: number; rows?: number }) {
  const widths = ['w-10', 'w-20', 'w-28', 'w-16', 'w-24', 'w-14', 'w-32'];
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={`sk-${rowIndex}`}>
          {Array.from({ length: columns }, (_, colIndex) => {
            const lastRow = rowIndex === rows - 1;
            return (
              <td
                key={colIndex}
                className={cn(
                  'bg-surface px-5 py-4',
                  !lastRow && 'border-b border-border',
                  lastRow && colIndex === 0 && 'rounded-bl-[var(--radius-card)]',
                  lastRow && colIndex === columns - 1 && 'rounded-br-[var(--radius-card)]',
                )}
              >
                <span
                  className={cn(
                    'block h-4 animate-pulse rounded-md bg-surface-soft',
                    widths[(rowIndex + colIndex) % widths.length],
                  )}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
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
    emptyTitle = 'Sin resultados',
    emptyAction,
  } = props;

  const selectable = Boolean(selectedKeys && onToggleRow);
  const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedKeys?.includes(rowKey(row)));
  const someSelected = selectable && rows.some((row) => selectedKeys?.includes(rowKey(row)));
  const totalColumns = columns.length + (selectable ? 1 : 0);
  const thBase =
    'sticky top-[var(--table-sticky-top,var(--topbar-h,5rem))] z-10 bg-surface px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-text-secondary shadow-[0_1px_0_0_var(--color-border)]';

  const handleRowKey = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className="glass-card overflow-clip">
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className={cn(thBase, 'w-12 rounded-tl-[var(--radius-card)]')}>
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
              {columns.map((column, colIndex) => {
                const active = sortKey === column.key;
                const isFirst = !selectable && colIndex === 0;
                const isLast = colIndex === columns.length - 1;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={cn(
                      thBase,
                      alignClasses[column.align ?? 'left'],
                      isFirst && 'rounded-tl-[var(--radius-card)]',
                      isLast && 'rounded-tr-[var(--radius-card)]',
                    )}
                  >
                    {onSort && column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                          active && 'text-text',
                        )}
                      >
                        {column.header}
                        <span
                          className={cn(
                            'inline-flex transition-transform duration-200',
                            active && sortDirection === 'asc' ? 'rotate-0' : active ? 'rotate-180' : 'opacity-30',
                          )}
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                        </span>
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
            {loading ? (
              <SkeletonRows columns={totalColumns} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="rounded-b-[var(--radius-card)] bg-surface p-0">
                  <EmptyState title={emptyTitle} description={emptyMessage} action={emptyAction} />
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {rows.map((row, index) => {
                  const key = rowKey(row);
                  const selected = selectedKeys?.includes(key) ?? false;
                  const lastRow = index === rows.length - 1;
                  return (
                    <motion.tr
                      key={key}
                      variants={index < 12 ? tableRowVariants : undefined}
                      initial={index < 12 ? 'hidden' : false}
                      animate={index < 12 ? 'show' : undefined}
                      exit="exit"
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={(e) => handleRowKey(e, row)}
                      tabIndex={onRowClick ? 0 : undefined}
                      className={cn(
                        'group transition-colors duration-150',
                        'min-h-[56px]',
                        onRowClick && 'cursor-pointer focus-visible:outline-none',
                        selected && 'bg-spot',
                      )}
                    >
                      {selectable && (
                        <td
                          className={cn(
                            'bg-surface px-5 py-4',
                            !lastRow && 'border-b border-border',
                            lastRow && 'rounded-bl-[var(--radius-card)]',
                            onRowClick ? 'group-hover:bg-spot group-focus-visible:bg-spot' : 'group-hover:bg-spot/60',
                            selected && 'bg-spot',
                          )}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar fila ${key}`}
                            checked={selected}
                            onChange={() => onToggleRow?.(key)}
                            className="h-4 w-4 rounded border-border-strong accent-[var(--color-accent)]"
                          />
                        </td>
                      )}
                      {columns.map((column, colIndex) => {
                        const isLastCol = colIndex === columns.length - 1;
                        const isFirstCol = !selectable && colIndex === 0;
                        return (
                          <td
                            key={column.key}
                            className={cn(
                              'bg-surface px-5 py-4 align-middle text-text-secondary',
                              alignClasses[column.align ?? 'left'],
                              !lastRow && 'border-b border-border',
                              lastRow && isFirstCol && 'rounded-bl-[var(--radius-card)]',
                              lastRow && isLastCol && 'rounded-br-[var(--radius-card)]',
                              onRowClick ? 'group-hover:bg-spot group-focus-visible:bg-spot' : 'group-hover:bg-spot/60',
                              selected && 'bg-spot',
                            )}
                          >
                            {column.render(row)}
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </motion.tbody>
        </table>
      </div>

      <div className="md:hidden">
        {loading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="space-y-2.5 p-5">
                {Array.from({ length: 3 }, (_, inner) => (
                  <span key={inner} className="block h-4 animate-pulse rounded-md bg-surface-soft" />
                ))}
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyMessage} action={emptyAction} />
        ) : (
          <motion.ul variants={tableContainerVariants} initial="hidden" animate="show" className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {rows.map((row) => {
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
                      <div className="min-w-0 w-full space-y-2.5">
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
        )}
      </div>
    </div>
  );
}
