'use client'

// Third-party Imports
import type { Column } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

// Util Imports
import { cn } from '@/lib/utils'

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
  className?: string
}

const DataTableColumnHeader = <TData, TValue>({
  column,
  title,
  className
}: DataTableColumnHeaderProps<TData, TValue>) => {
  // Vars
  const sorted = column.getIsSorted()

  if (!column.getCanSort()) {
    return <span className={cn('text-muted-foreground text-sm font-medium', className)}>{title}</span>
  }

  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex w-full items-center justify-between gap-1 text-sm font-medium',
        className
      )}
    >
      <span>{title}</span>
      {sorted === 'desc' ? (
        <ArrowDownIcon className='text-foreground size-3.5' />
      ) : sorted === 'asc' ? (
        <ArrowUpIcon className='text-foreground size-3.5' />
      ) : (
        <ArrowUpIcon className='size-3.5 opacity-0 transition-opacity group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60' />
      )}
    </span>
  )
}

export default DataTableColumnHeader
