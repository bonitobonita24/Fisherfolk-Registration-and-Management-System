'use client'

// React Imports
import { useEffect, useState } from 'react'

// Third-party Imports
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  Table,
  VisibilityState
} from '@tanstack/react-table'

type UseEntityTableOptions<TData> = {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  getRowId?: (row: TData) => string
  initialSorting?: SortingState
  initialVisibility?: VisibilityState
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  pageSize?: number
  enableRowSelection?: boolean
  pinnedRowIds?: string[]
}

export const useEntityTable = <TData>({
  data,
  columns,
  getRowId,
  initialSorting,
  initialVisibility,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  pageSize = 10,
  enableRowSelection = false,
  pinnedRowIds
}: UseEntityTableOptions<TData>): Table<TData> => {
  // Vars
  const isVisibilityControlled = controlledVisibility !== undefined

  // States
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [internalVisibility, setInternalVisibility] = useState<VisibilityState>(initialVisibility ?? {})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = updater => {
    setColumnFilters(updater)
    setPagination(prev => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }))
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    getRowId: getRowId && (row => getRowId(row)),
    state: {
      sorting,
      columnFilters,
      columnVisibility: isVisibilityControlled ? controlledVisibility : internalVisibility,
      pagination,
      ...(enableRowSelection ? { rowSelection } : {}),
      ...(pinnedRowIds ? { rowPinning: { top: pinnedRowIds } } : {})
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setInternalVisibility,
    onPaginationChange: setPagination,
    ...(enableRowSelection ? { onRowSelectionChange: setRowSelection } : {}),
    ...(pinnedRowIds ? { onRowPinningChange: () => {}, enableRowPinning: true } : {}),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    enableSortingRemoval: false
  })

  const lastPageIndex = Math.max(0, table.getPageCount() - 1)

  useEffect(() => {
    if (pagination.pageIndex > lastPageIndex) {
      setPagination(prev => (prev.pageIndex > lastPageIndex ? { ...prev, pageIndex: lastPageIndex } : prev))
    }
  }, [lastPageIndex, pagination.pageIndex])

  return table
}
