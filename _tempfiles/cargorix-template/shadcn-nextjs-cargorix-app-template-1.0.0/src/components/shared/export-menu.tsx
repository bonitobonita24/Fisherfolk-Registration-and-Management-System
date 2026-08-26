'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { ChevronDownIcon, CopyIcon, FileTextIcon, PrinterIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { ExportTable } from '@/types'

// Component Imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Util Imports
import { copyTable, downloadCsv, printTable } from '@/lib/export'

type ExportMenuProps = {
  getTable: () => ExportTable
  filename: string
  title: string
  align?: 'start' | 'end'
}

const ExportMenu = ({ getTable, filename, title, align = 'end' }: ExportMenuProps) => {
  // States
  const [copiedSummary, setCopiedSummary] = useState<{ rows: number; columns: number } | null>(null)

  const withRows = (action: (table: ExportTable) => void) => () => {
    const table = getTable()

    if (table.rows.length === 0) {
      toast.error('Nothing to export', { description: 'No rows match the current filters.' })

      return
    }

    action(table)
  }

  const handlePrint = withRows(table => printTable(table, title))

  const handleCsv = withRows(table => {
    downloadCsv(table, filename)
    toast.success('CSV downloaded', { description: `${table.rows.length} rows exported.` })
  })

  const handleCopy = withRows(async table => {
    const copied = await copyTable(table)

    if (copied) {
      setCopiedSummary({ rows: table.rows.length, columns: table.headers.length })
    } else {
      toast.error('Copy failed', { description: 'Your browser blocked clipboard access.' })
    }
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant='secondary' className='gap-1.5' />}>
          Export
          <ChevronDownIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className='w-40'>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handlePrint}>
              <PrinterIcon data-icon='inline-start' />
              Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCsv}>
              <FileTextIcon data-icon='inline-start' />
              Csv
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <CopyIcon data-icon='inline-start' />
              Copy
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={copiedSummary !== null} onOpenChange={open => !open && setCopiedSummary(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copied to clipboard</AlertDialogTitle>
            <AlertDialogDescription>
              {copiedSummary?.rows.toLocaleString()} {copiedSummary?.rows === 1 ? 'row' : 'rows'} across{' '}
              {copiedSummary?.columns} {copiedSummary?.columns === 1 ? 'column' : 'columns'} copied from {title}. Paste
              into a spreadsheet to keep the columns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCopiedSummary(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ExportMenu
