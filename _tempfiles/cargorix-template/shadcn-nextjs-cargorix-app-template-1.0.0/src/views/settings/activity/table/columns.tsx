'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

// Type Imports
import type { ActivityEvent, ActivityResult } from '@/types/pages/activity-log'
import { ACTIVITY_RESULT_LABEL } from '@/types/pages/activity-log'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'

// Util Imports
import { getInitials } from '@/lib/get-initials'
import { cn } from '@/lib/utils'

export const ACTIVITY_RESULT_CLASS: Record<ActivityResult, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  failed: 'bg-destructive/10 text-destructive'
}

export const ACTIVITY_TOGGLEABLE_COLUMNS: { id: string; label: string }[] = [
  { id: 'user', label: 'User' },
  { id: 'action', label: 'Action' },
  { id: 'module', label: 'Module' },
  { id: 'record', label: 'Record' },
  { id: 'result', label: 'Result' }
]

const getActivityColumns = (): ColumnDef<ActivityEvent>[] => [
  {
    id: 'at',
    accessorFn: row => new Date(row.at).getTime(),
    meta: { label: 'Date & Time' },
    enableHiding: false,
    sortingFn: 'basic',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Date & Time' />,
    cell: ({ row }) => {
      const at = new Date(row.original.at)

      return (
        <div className='flex flex-col'>
          <span className='font-medium whitespace-nowrap'>{format(at, 'MMM d, yyyy')}</span>
          <span className='text-muted-foreground text-xs'>{format(at, 'HH:mm:ss')}</span>
        </div>
      )
    }
  },
  {
    id: 'user',
    accessorFn: row => row.userName,
    meta: { label: 'User' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
    cell: ({ row }) => {
      const event = row.original

      return (
        <div className='flex items-center gap-2.5'>
          <Avatar className='size-8'>
            <AvatarFallback className='bg-muted text-muted-foreground text-xs'>
              {getInitials(event.userName)}
            </AvatarFallback>
          </Avatar>
          <span className='truncate font-medium'>{event.userName}</span>
        </div>
      )
    }
  },
  {
    id: 'action',
    accessorFn: row => row.action,
    meta: { label: 'Action' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Action' />,
    cell: ({ row }) => <span className='font-medium'>{row.original.action}</span>
  },
  {
    id: 'module',
    accessorFn: row => row.module,
    meta: { label: 'Module' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Module' />,
    cell: ({ row }) => (
      <Badge variant='outline' className='font-normal whitespace-nowrap'>
        {row.original.module}
      </Badge>
    )
  },
  {
    id: 'record',
    accessorFn: row => row.record,
    meta: { label: 'Record' },
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title='Record' />,
    cell: ({ row }) => {
      const event = row.original

      if (!event.recordHref) {
        return <span className='text-muted-foreground'>{event.record}</span>
      }

      return (
        <Button
          variant='link'
          render={<Link href={event.recordHref} />}
          nativeButton={false}
          className='text-foreground h-auto justify-start p-0 font-medium'
        >
          {event.record}
        </Button>
      )
    }
  },
  {
    id: 'result',
    accessorFn: row => row.result,
    meta: { label: 'Result' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Result' />,
    cell: ({ row }) => {
      const result = row.original.result

      return <Badge className={cn('font-normal', ACTIVITY_RESULT_CLASS[result])}>{ACTIVITY_RESULT_LABEL[result]}</Badge>
    }
  }
]

export default getActivityColumns
