'use client'

// Third-party Imports
import { SearchIcon } from 'lucide-react'

// Type Imports
import type { OrderKanbanColumnId } from '@/lib/selectors/orders-selectors'

// Component Imports
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { ORDER_KANBAN_COLUMNS, ORDER_KANBAN_COLUMN_LABEL } from '@/lib/selectors/orders-selectors'

const COLUMN_OPTIONS = [
  { label: 'All columns', value: 'all' },
  ...ORDER_KANBAN_COLUMNS.map(column => ({ label: ORDER_KANBAN_COLUMN_LABEL[column], value: column }))
]

type KanbanToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  column: OrderKanbanColumnId | 'all'
  onColumnChange: (value: OrderKanbanColumnId | 'all') => void
}

const KanbanToolbar = ({ search, onSearchChange, column, onColumnChange }: KanbanToolbarProps) => {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <InputGroup className='sm:w-72'>
        <InputGroupInput
          className='input-default'
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder='Search orders...'
          aria-label='Search orders'
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>

      <Select
        items={COLUMN_OPTIONS}
        value={column}
        onValueChange={value => onColumnChange(value as OrderKanbanColumnId | 'all')}
      >
        <SelectTrigger className='w-48' aria-label='Filter board columns'>
          <SelectValue placeholder='All columns' />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className='w-auto max-w-(--available-width) min-w-(--anchor-width)'>
          <SelectGroup>
            {COLUMN_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default KanbanToolbar
