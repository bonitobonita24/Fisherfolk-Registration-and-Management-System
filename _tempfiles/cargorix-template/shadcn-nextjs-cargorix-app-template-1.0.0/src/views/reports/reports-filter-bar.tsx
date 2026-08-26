'use client'

// Third-party Imports
import { GitCompareArrowsIcon } from 'lucide-react'

// Type Imports
import type { ExportTable } from '@/types'
import type { ReportBounds, ReportWindow } from '@/types/pages/reports-types'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

// Shared Imports
import DateRangePicker from '@/components/shared/date-range-picker'
import ExportMenu from '@/components/shared/export-menu'

// Store Imports
import { useReportsStore } from '@/store/use-reports-store'

type ContextualFilter = {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}

type ReportsFilterBarProps = {
  window: ReportWindow
  bounds: ReportBounds
  contextual: ContextualFilter
  getExportTable: () => ExportTable
  exportFilename: string
  exportTitle: string
}

const ReportsFilterBar = ({
  window,
  bounds,
  contextual,
  getExportTable,
  exportFilename,
  exportTitle
}: ReportsFilterBarProps) => {
  // Hooks
  const setDateRange = useReportsStore(state => state.setDateRange)
  const compare = useReportsStore(state => state.compare)
  const setCompare = useReportsStore(state => state.setCompare)

  return (
    <Card size='sm'>
      <CardContent className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <div className='min-w-0'>
            <Label htmlFor='report-range' className='text-muted-foreground text-xs'>
              Date range
            </Label>
            <DateRangePicker
              id='report-range'
              from={window.start}
              to={new Date(window.end.getTime() - 1)}
              min={bounds.start}
              max={bounds.end}
              onChange={setDateRange}
            />
          </div>

          <Separator orientation='vertical' className='hidden h-10 data-vertical:self-center sm:block' />

          <div className='min-w-0'>
            <Label htmlFor='report-contextual' className='text-muted-foreground text-xs'>
              {contextual.label}
            </Label>
            <Select
              items={contextual.options}
              value={contextual.value}
              onValueChange={value => {
                if (value) contextual.onChange(value)
              }}
            >
              <SelectTrigger id='report-contextual' className='mt-1 w-52' aria-label={contextual.label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
              >
                <SelectGroup>
                  {contextual.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2.5'>
            <GitCompareArrowsIcon className='text-muted-foreground size-4 shrink-0' />
            <Label htmlFor='report-compare' className='cursor-pointer text-sm font-normal'>
              Compare to previous period
            </Label>
            <Switch
              id='report-compare'
              checked={compare}
              onCheckedChange={setCompare}
              aria-label='Compare to previous period'
            />
          </div>

          <ExportMenu getTable={getExportTable} filename={exportFilename} title={exportTitle} />
        </div>
      </CardContent>

      <CardContent className='border-t pt-4'>
        <p className='text-muted-foreground text-xs'>
          Showing <span className='text-foreground font-medium'>{window.label}</span>
          {compare && (
            <>
              {' · compared with '}
              <span className='text-foreground font-medium'>{window.previousLabel}</span>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

export type { ContextualFilter }
export default ReportsFilterBar
