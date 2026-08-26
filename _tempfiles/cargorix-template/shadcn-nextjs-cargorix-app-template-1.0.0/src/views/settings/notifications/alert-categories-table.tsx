'use client'

// React Imports
import type { ComponentType } from 'react'

// Third-party Imports
import {
  ArrowLeftRightIcon,
  BellRingIcon,
  ClipboardCheckIcon,
  ClockIcon,
  FileTextIcon,
  IdCardIcon,
  PackageSearchIcon,
  PackageXIcon,
  RouteIcon,
  TruckIcon,
  WarehouseIcon,
  WrenchIcon
} from 'lucide-react'

// Type Imports
import type {
  AlertPriority,
  DigestFrequency,
  NotificationChannel,
  NotificationSettings
} from '@/types/pages/notification-settings'
import { ALERT_PRIORITY_OPTIONS, DIGEST_FREQUENCY_OPTIONS } from '@/types/pages/notification-settings'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Store Imports
import { useNotificationSettingsStore } from '@/store/use-notification-settings-store'

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  truck: TruckIcon,
  'package-x': PackageXIcon,
  'package-search': PackageSearchIcon,
  'clipboard-check': ClipboardCheckIcon,
  'arrow-left-right': ArrowLeftRightIcon,
  route: RouteIcon,
  wrench: WrenchIcon,
  'id-card': IdCardIcon,
  warehouse: WarehouseIcon,
  'file-text': FileTextIcon
}

const CHANNEL_COLUMNS: { key: NotificationChannel; label: string }[] = [
  { key: 'inApp', label: 'In-App' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' }
]

// Props
type AlertCategoriesTableProps = {
  categories: NotificationSettings['categories']
  channels: NotificationSettings['channels']
}

const AlertCategoriesTable = ({ categories, channels }: AlertCategoriesTableProps) => {
  // Hooks
  const setCategoryChannel = useNotificationSettingsStore(state => state.setCategoryChannel)
  const setCategoryPriority = useNotificationSettingsStore(state => state.setCategoryPriority)
  const setCategoryFrequency = useNotificationSettingsStore(state => state.setCategoryFrequency)
  const setCategorySendAt = useNotificationSettingsStore(state => state.setCategorySendAt)

  return (
    <Card className='gap-0 p-0 shadow-none'>
      <CardHeader className='p-6 pb-4'>
        <div className='flex items-start gap-3'>
          <span className='bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <BellRingIcon className='size-4.5' />
          </span>
          <div className='min-w-0'>
            <CardTitle>Alert Categories</CardTitle>
            <CardDescription>Choose how each type of alert reaches you and how urgent it is.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='overflow-x-auto p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='text-muted-foreground min-w-72 p-4 text-xs font-medium tracking-wide uppercase'>
                Alert Category
              </TableHead>
              {CHANNEL_COLUMNS.map(column => (
                <TableHead
                  key={column.key}
                  className='text-muted-foreground p-4 text-center text-xs font-medium tracking-wide uppercase'
                >
                  {column.label}
                </TableHead>
              ))}
              <TableHead className='text-muted-foreground min-w-56 p-4 text-xs font-medium tracking-wide uppercase'>
                Priority / Frequency
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(category => {
              const Icon = CATEGORY_ICONS[category.icon] ?? BellRingIcon

              return (
                <TableRow key={category.id}>
                  <TableCell className='p-4'>
                    <div className='flex items-center gap-3'>
                      <span className='flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                        <Icon className='text-muted-foreground size-4.5' />
                      </span>
                      <div className='min-w-0'>
                        <p className='font-medium'>{category.label}</p>
                        <p className='text-muted-foreground text-xs'>{category.description}</p>
                      </div>
                    </div>
                  </TableCell>

                  {CHANNEL_COLUMNS.map(column => (
                    <TableCell key={column.key} className='p-4'>
                      <div className='flex justify-center'>
                        <Switch
                          checked={category[column.key]}
                          disabled={!channels[column.key]}
                          onCheckedChange={value => setCategoryChannel(category.id, column.key, value)}
                          aria-label={`${column.label} notifications for ${category.label}`}
                        />
                      </div>
                    </TableCell>
                  ))}

                  <TableCell className='p-4'>
                    {category.frequency ? (
                      <div className='flex items-center gap-2'>
                        <Select
                          items={DIGEST_FREQUENCY_OPTIONS}
                          value={category.frequency}
                          onValueChange={value => setCategoryFrequency(category.id, value as DigestFrequency)}
                        >
                          <SelectTrigger
                            className='w-32'
                            aria-label={`Frequency for ${category.label}`}
                            id={`${category.id}-frequency`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent
                            alignItemWithTrigger={false}
                            className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                          >
                            <SelectGroup>
                              {DIGEST_FREQUENCY_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <InputGroup className='w-28'>
                          <InputGroupInput
                            id={`${category.id}-send-at`}
                            value={category.sendAt ?? ''}
                            placeholder='08:00'
                            aria-label={`Send time for ${category.label}`}
                            onChange={event => setCategorySendAt(category.id, event.target.value)}
                          />
                          <InputGroupAddon align='inline-end'>
                            <ClockIcon />
                          </InputGroupAddon>
                        </InputGroup>
                      </div>
                    ) : (
                      <Select
                        items={ALERT_PRIORITY_OPTIONS}
                        value={category.priority}
                        onValueChange={value => setCategoryPriority(category.id, value as AlertPriority)}
                      >
                        <SelectTrigger
                          className='w-32'
                          aria-label={`Priority for ${category.label}`}
                          id={`${category.id}-priority`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                        >
                          <SelectGroup>
                            {ALERT_PRIORITY_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default AlertCategoriesTable
