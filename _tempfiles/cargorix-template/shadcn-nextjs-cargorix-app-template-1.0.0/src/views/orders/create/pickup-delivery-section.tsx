// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { Controller, useWatch, type Control } from 'react-hook-form'
import { CalendarClockIcon, MapPinIcon, RouteIcon, WarehouseIcon } from 'lucide-react'

// Type Imports
import type { ServiceLevel } from '@/types/entities/order'
import type { OrderLocationOption } from '@/lib/selectors/orders-selectors'
import type { CreateOrderFormInput } from './create-order-schema'

// Component Imports
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Shared Imports
import DatePicker from '@/components/shared/date-picker'
import RequiredMark from '@/components/shared/required-mark'

// Util Imports
import { SERVICE_BASE_RATE, computeRouteMetrics } from '@/lib/selectors/orders-selectors'
import { laterOf, todayDate } from '@/lib/date-bounds'

const SERVICE_LEVEL_OPTIONS: { label: string; value: ServiceLevel; detail: string }[] = [
  { label: 'Regular — 2–5 business days', value: 'regular', detail: `Base rate $${SERVICE_BASE_RATE.regular}` },
  { label: 'Express — Next business day', value: 'express', detail: `Base rate $${SERVICE_BASE_RATE.express}` },
  { label: 'Same day — Today', value: 'same_day', detail: `Base rate $${SERVICE_BASE_RATE.same_day}` }
]

const formatDriveTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)

  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`
}

type LocationPanelProps = {
  icon: typeof MapPinIcon
  title: string
  subtitle: string
  children: ReactNode
}

const LocationPanel = ({ icon: Icon, title, subtitle, children }: LocationPanelProps) => (
  <div className='space-y-4 rounded-xl border p-4'>
    <div className='flex items-center gap-2.5'>
      <span className='bg-accent text-accent-foreground grid size-7 shrink-0 place-items-center rounded-lg'>
        <Icon className='size-3.5' />
      </span>
      <div className='min-w-0'>
        <p className='text-sm font-semibold'>{title}</p>
        <p className='text-muted-foreground truncate text-xs'>{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
)

type PickupDeliverySectionProps = {
  control: Control<CreateOrderFormInput>
  pickupLocations: OrderLocationOption[]
  deliveryLocations: OrderLocationOption[]
}

const PickupDeliverySection = ({ control, pickupLocations, deliveryLocations }: PickupDeliverySectionProps) => {
  // Hooks
  const pickupAddress = useWatch({ control, name: 'pickupAddress' })
  const deliveryAddress = useWatch({ control, name: 'deliveryAddress' })
  const requestedPickupAt = useWatch({ control, name: 'requestedPickupAt' })

  // Vars
  const pickup = pickupLocations.find(option => option.value === pickupAddress)
  const delivery = deliveryLocations.find(option => option.value === deliveryAddress)
  const metrics = pickup && delivery ? computeRouteMetrics(pickup, delivery) : null

  const routeFacts = metrics
    ? [
        { label: 'Distance', value: `${metrics.distanceKm} km` },
        { label: 'Drive time', value: `~${formatDriveTime(metrics.etaMinutes)}` },
        { label: 'Tolls', value: `$${metrics.tollEstimate.toFixed(2)}` }
      ]
    : []

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2'>
        <LocationPanel icon={WarehouseIcon} title='Pickup' subtitle='Hub the goods are collected from'>
          <FieldGroup className='grid gap-4'>
            <Controller
              name='pickupAddress'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='pickup-address'>
                    Warehouse <RequiredMark />
                  </FieldLabel>
                  <Select items={pickupLocations} value={field.value || null} onValueChange={field.onChange}>
                    <SelectTrigger id='pickup-address' className='w-full' aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder='Select a warehouse' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='max-h-72 w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {pickupLocations.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className='flex min-w-0 flex-col'>
                              <span className='truncate'>{option.label}</span>
                              <span className='text-muted-foreground truncate text-xs'>{option.detail}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='pickupAddressDetail'
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='pickup-address-detail'>Dock or unit</FieldLabel>
                  <Input id='pickup-address-detail' placeholder='e.g. Dock B, Bay 4' {...field} />
                </Field>
              )}
            />
          </FieldGroup>
        </LocationPanel>

        <LocationPanel icon={MapPinIcon} title='Delivery' subtitle='Where the client receives the goods'>
          <FieldGroup className='grid gap-4'>
            <Controller
              name='deliveryAddress'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='delivery-address'>
                    Address <RequiredMark />
                  </FieldLabel>
                  <Select items={deliveryLocations} value={field.value || null} onValueChange={field.onChange}>
                    <SelectTrigger id='delivery-address' className='w-full' aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder='Select a delivery address' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='max-h-72 w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {deliveryLocations.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className='flex min-w-0 flex-col'>
                              <span className='truncate'>{option.label}</span>
                              <span className='text-muted-foreground truncate text-xs'>{option.detail}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='deliveryAddressDetail'
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='delivery-address-detail'>Unit, floor or contact</FieldLabel>
                  <Input id='delivery-address-detail' placeholder='e.g. Suite 300, ask for Ana' {...field} />
                </Field>
              )}
            />
          </FieldGroup>
        </LocationPanel>
      </div>

      <div className='bg-muted/40 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-dashed px-4 py-3'>
        <span className='flex items-center gap-2 text-sm font-medium'>
          <RouteIcon className='text-muted-foreground size-4' aria-hidden='true' />
          Estimated route
        </span>
        {metrics ? (
          routeFacts.map(fact => (
            <span key={fact.label} className='flex items-center gap-1.5 text-sm'>
              <span className='text-muted-foreground'>{fact.label}</span>
              <span className='font-semibold tabular-nums'>{fact.value}</span>
            </span>
          ))
        ) : (
          <span className='text-muted-foreground text-sm'>
            Pick both locations — their coordinates set the distance, drive time and tolls saved on the order.
          </span>
        )}
      </div>

      <div className='space-y-4 border-t pt-5'>
        <div className='flex items-center gap-2'>
          <CalendarClockIcon className='text-muted-foreground size-4' aria-hidden='true' />
          <p className='text-sm font-semibold'>Schedule &amp; service</p>
        </div>

        <FieldGroup className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Controller
            name='requestedPickupAt'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='requested-pickup'>
                  Requested pickup <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='requested-pickup'
                  value={field.value}
                  onChange={field.onChange}
                  min={todayDate()}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>Earliest date the goods can be collected.</FieldDescription>
                )}
              </Field>
            )}
          />

          <Controller
            name='requiredDeliveryAt'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='required-delivery'>
                  Required delivery <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='required-delivery'
                  value={field.value}
                  onChange={field.onChange}
                  min={laterOf(todayDate(), requestedPickupAt)}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>Deadline promised to the client.</FieldDescription>
                )}
              </Field>
            )}
          />

          <Controller
            name='serviceLevel'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel className='gap-0' htmlFor='service-level'>
                  Service level <RequiredMark />
                </FieldLabel>
                <Select items={SERVICE_LEVEL_OPTIONS} value={field.value || 'regular'} onValueChange={field.onChange}>
                  <SelectTrigger id='service-level' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {SERVICE_LEVEL_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className='flex min-w-0 flex-col'>
                            <span className='truncate'>{option.label}</span>
                            <span className='text-muted-foreground truncate text-xs'>{option.detail}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>Sets the transit promise and the base rate.</FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>
      </div>
    </div>
  )
}

export default PickupDeliverySection
