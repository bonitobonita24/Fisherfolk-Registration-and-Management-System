'use client'

// Third-party Imports
import type { Table } from '@tanstack/react-table'

// Component Imports
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type FacetFilterConfig = {
  columnId: string
  label: string
  placeholder: string
  width?: string
  options: { label: string; value: string }[]
}

type FacetFilterProps<TData> = {
  table: Table<TData>
  filter: FacetFilterConfig
}

const FacetFilter = <TData,>({ table, filter }: FacetFilterProps<TData>) => {
  // Vars
  const column = table.getColumn(filter.columnId)

  return (
    <Select
      items={filter.options}
      value={(column?.getFilterValue() as string) ?? 'all'}
      onValueChange={value => column?.setFilterValue(value === 'all' ? undefined : value)}
    >
      <SelectTrigger className={filter.width ?? 'w-40'} aria-label={filter.label}>
        <SelectValue placeholder={filter.placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className='w-auto max-w-(--available-width) min-w-(--anchor-width)'>
        <SelectGroup>
          {filter.options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default FacetFilter
