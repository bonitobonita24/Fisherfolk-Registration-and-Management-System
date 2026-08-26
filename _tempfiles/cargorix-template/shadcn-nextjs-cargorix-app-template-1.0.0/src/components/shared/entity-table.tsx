'use client'

// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import type { Table } from '@tanstack/react-table'

// Type Imports
import type { ExportTable } from '@/types'
import type { FacetFilterConfig } from '@/components/shared/facet-filter'

// Component Imports
import { Card } from '@/components/ui/card'

// Shared Imports
import DataTable from '@/components/shared/data-table'
import TablePagination from '@/components/shared/table-pagination'
import TableToolbar from '@/components/shared/table-toolbar'

type EntityTableProps<TData> = {
  table: Table<TData>
  columnCount: number
  noun: string
  emptyMessage: string
  rowHref?: (row: TData) => string
  rowLabel?: (row: TData) => string
  interactiveColumnIds?: string[]
  scrollable?: boolean
  search?: { columnId: string; label: string; placeholder?: string }
  filters?: FacetFilterConfig[]
  exportAs?: { filename: string; title: string; build: (rows: TData[]) => ExportTable }
  extra?: ReactNode
  compact?: boolean
  pageSizes?: number[]
  className?: string
}

const EntityTable = <TData,>({
  table,
  columnCount,
  noun,
  emptyMessage,
  rowHref,
  rowLabel,
  interactiveColumnIds,
  scrollable,
  search,
  filters,
  exportAs,
  extra,
  compact,
  pageSizes,
  className
}: EntityTableProps<TData>) => (
  <Card className={className ?? 'gap-0 py-0'}>
    <TableToolbar
      table={table}
      search={search}
      filters={filters}
      exportAs={exportAs}
      extra={extra}
      compact={compact}
      pageSizes={pageSizes}
    />
    <DataTable
      table={table}
      columnCount={columnCount}
      emptyMessage={emptyMessage}
      rowHref={rowHref}
      rowLabel={rowLabel}
      interactiveColumnIds={interactiveColumnIds}
      scrollable={scrollable}
    />
    <TablePagination table={table} noun={noun} />
  </Card>
)

export default EntityTable
