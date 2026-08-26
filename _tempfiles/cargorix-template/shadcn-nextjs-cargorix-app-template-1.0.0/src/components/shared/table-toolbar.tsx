'use client'

// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import type { Table } from '@tanstack/react-table'
import { FilterXIcon, LayoutGridIcon, SearchIcon } from 'lucide-react'

// Type Imports
import type { ExportTable } from '@/types'
import type { FacetFilterConfig } from '@/components/shared/facet-filter'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Shared Imports
import ExportMenu from '@/components/shared/export-menu'
import FacetFilter from '@/components/shared/facet-filter'

// Util Imports
import { cn } from '@/lib/utils'

const DEFAULT_PAGE_SIZES = [10, 20, 30, 50]

type TableToolbarProps<TData> = {
  table: Table<TData>
  search?: { columnId: string; label: string; placeholder?: string }
  filters?: FacetFilterConfig[]
  exportAs?: { filename: string; title: string; build: (rows: TData[]) => ExportTable }
  extra?: ReactNode
  compact?: boolean
  pageSizes?: number[]
}

const TableToolbar = <TData,>({
  table,
  search,
  filters,
  exportAs,
  extra,
  compact,
  pageSizes = DEFAULT_PAGE_SIZES
}: TableToolbarProps<TData>) => {
  // Vars
  const searchColumn = search ? table.getColumn(search.columnId) : undefined

  const pageSizeOptions = pageSizes.map(size => ({ label: `${size}`, value: `${size}` }))

  const handleClear = () => {
    searchColumn?.setFilterValue(undefined)
    filters?.forEach(filter => table.getColumn(filter.columnId)?.setFilterValue(undefined))
  }

  const getExportTable = () => {
    const rows = table.getFilteredRowModel().rows.map(row => row.original)

    return exportAs ? exportAs.build(rows) : { headers: [], rows: [] }
  }

  const pageSizeSelect = (
    <Select
      items={pageSizeOptions}
      value={`${table.getState().pagination.pageSize}`}
      onValueChange={value => table.setPageSize(Number(value))}
    >
      <SelectTrigger className='w-full sm:w-20' aria-label='Rows per page'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className='w-auto max-w-(--available-width) min-w-(--anchor-width)'>
        <SelectGroup>
          {pageSizeOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )

  const leftContent = (
    <>
      {search && (
        <InputGroup className='sm:w-72'>
          <InputGroupInput
            className='input-default'
            value={(searchColumn?.getFilterValue() as string) ?? ''}
            onChange={e => searchColumn?.setFilterValue(e.target.value)}
            placeholder={search.placeholder ?? `${search.label}...`}
            aria-label={search.label}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      )}
      {compact ? pageSizeSelect : <div className='flex items-center gap-2'>{pageSizeSelect}</div>}
    </>
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b px-4 py-3',
        compact ? 'sm:flex-row sm:items-center' : 'lg:flex-row lg:items-start lg:justify-between'
      )}
    >
      {compact ? leftContent : <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>{leftContent}</div>}

      {!compact && (
        <div className='flex flex-wrap items-center gap-2 **:data-[slot="select-trigger"]:max-sm:w-full lg:justify-end'>
          {extra}
          {filters?.map(filter => (
            <FacetFilter key={filter.columnId} table={table} filter={filter} />
          ))}
          {exportAs && <ExportMenu getTable={getExportTable} filename={exportAs.filename} title={exportAs.title} />}

          <Tooltip>
            <TooltipTrigger
              render={<Button variant='outline' size='icon' aria-label='Clear filters' onClick={handleClear} />}
            >
              <FilterXIcon className='size-4' />
            </TooltipTrigger>
            <TooltipContent>Clear filter</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant='outline' size='icon' className='gap-1.5' aria-label='Toggle columns' />}
            >
              <LayoutGridIcon className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter(col => col.getCanHide())
                  .map(col => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={value => col.toggleVisibility(!!value)}
                      closeOnClick={false}
                    >
                      {col.columnDef.meta?.label ?? col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

export default TableToolbar
