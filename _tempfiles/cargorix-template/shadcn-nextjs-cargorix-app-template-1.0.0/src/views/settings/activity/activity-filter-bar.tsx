'use client'

// Third-party Imports
import { startOfDay } from 'date-fns'
import { FilterXIcon, LayoutGridIcon, SearchIcon } from 'lucide-react'
import type { VisibilityState } from '@tanstack/react-table'

// Type Imports
import type { ExportTable } from '@/types'
import type { ActivityBounds, ActivityFilters } from '@/types/pages/activity-log'

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
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Shared Imports
import DateRangePicker from '@/components/shared/date-range-picker'
import ExportMenu from '@/components/shared/export-menu'

// Util Imports
import { toDate, todayDate } from '@/lib/date-bounds'

// Data Imports
import { ACTIVITY_TOGGLEABLE_COLUMNS } from './table/columns'

type ActivityFilterBarProps = {
  filters: ActivityFilters
  bounds: ActivityBounds
  columnVisibility: VisibilityState
  getExportTable: () => ExportTable
  onFilterChange: (patch: Partial<ActivityFilters>) => void
  onColumnVisibilityChange: (id: string, visible: boolean) => void
  onReset: () => void
}

const ActivityFilterBar = ({
  filters,
  bounds,
  columnVisibility,
  getExportTable,
  onFilterChange,
  onColumnVisibilityChange,
  onReset
}: ActivityFilterBarProps) => {
  // Vars
  const max = toDate(todayDate())!
  const from = filters.from ? startOfDay(new Date(`${filters.from}T00:00:00`)) : startOfDay(bounds.first)
  const to = filters.to ? startOfDay(new Date(`${filters.to}T00:00:00`)) : startOfDay(bounds.last)

  return (
    <div className='flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-end lg:justify-between'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='min-w-0 sm:w-72'>
          <Label htmlFor='activity-search' className='text-muted-foreground text-xs'>
            Search
          </Label>
          <InputGroup className='mt-1'>
            <InputGroupInput
              className='input-default'
              id='activity-search'
              value={filters.search}
              onChange={e => onFilterChange({ search: e.target.value })}
              placeholder='Search activity...'
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className='min-w-0 sm:w-64'>
          <Label htmlFor='activity-range' className='text-muted-foreground text-xs'>
            Date range
          </Label>
          <DateRangePicker
            id='activity-range'
            from={from}
            to={to}
            max={max}
            onChange={(nextFrom, nextTo) => onFilterChange({ from: nextFrom, to: nextTo })}
          />
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <ExportMenu getTable={getExportTable} filename='activity-log' title='Activity Log' />

        <Tooltip>
          <TooltipTrigger
            render={<Button variant='outline' size='icon' aria-label='Clear filters' onClick={onReset} />}
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
              {ACTIVITY_TOGGLEABLE_COLUMNS.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={value => onColumnVisibilityChange(column.id, !!value)}
                  closeOnClick={false}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default ActivityFilterBar
