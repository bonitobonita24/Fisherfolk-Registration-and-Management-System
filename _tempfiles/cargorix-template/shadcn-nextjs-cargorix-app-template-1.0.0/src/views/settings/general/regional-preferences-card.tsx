// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { GlobeIcon } from 'lucide-react'

// Type Imports
import type { GeneralSettingsFormInput } from './general-settings-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIME_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS
} from './general-settings-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type RegionalPreferencesCardProps = {
  control: Control<GeneralSettingsFormInput>
}

const RegionalPreferencesCard = ({ control }: RegionalPreferencesCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <span className='bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <GlobeIcon className='size-4' />
          </span>
          Regional Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6'>
        <Controller
          name='timezone'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-timezone'>
                Time zone <RequiredMark />
              </FieldLabel>
              <Select items={TIMEZONE_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger id='gs-timezone' className='w-full'>
                  <SelectValue placeholder='Select a time zone' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {TIMEZONE_OPTIONS.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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
          name='language'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-language'>
                Language <RequiredMark />
              </FieldLabel>
              <Select items={LANGUAGE_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger id='gs-language' className='w-full'>
                  <SelectValue placeholder='Select a language' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {LANGUAGE_OPTIONS.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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
          name='currency'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-currency'>
                Default currency <RequiredMark />
              </FieldLabel>
              <Select items={CURRENCY_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger id='gs-currency' className='w-full'>
                  <SelectValue placeholder='Select a currency' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {CURRENCY_OPTIONS.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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
          name='dateFormat'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-date-format'>
                Date format <RequiredMark />
              </FieldLabel>
              <Select
                items={DATE_FORMAT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='gs-date-format' className='w-full'>
                  <SelectValue placeholder='Select a date format' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {DATE_FORMAT_OPTIONS.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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
          name='timeFormat'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel className='gap-0' id='gs-time-format-label'>
                Time format <RequiredMark />
              </FieldLabel>
              <div
                role='group'
                aria-labelledby='gs-time-format-label'
                className='bg-muted/50 flex gap-1 rounded-2xl p-1'
              >
                {TIME_FORMAT_OPTIONS.map(option => {
                  const isSelected = field.value === option.value

                  return (
                    <Button
                      key={option.value}
                      type='button'
                      variant='ghost'
                      size='sm'
                      aria-pressed={isSelected}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'flex-1',
                        isSelected &&
                          'bg-background text-foreground hover:bg-background dark:hover:bg-background shadow-sm'
                      )}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default RegionalPreferencesCard
