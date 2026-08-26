// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { BuildingIcon, GlobeIcon, MailIcon, PhoneIcon } from 'lucide-react'

// Type Imports
import type { GeneralSettingsFormInput } from './general-settings-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type CompanyInformationCardProps = {
  control: Control<GeneralSettingsFormInput>
}

const CompanyInformationCard = ({ control }: CompanyInformationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <span className='bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <BuildingIcon className='size-4' />
          </span>
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6 sm:grid-cols-2'>
        <Controller
          name='companyName'
          control={control}
          render={({ field, fieldState }) => (
            <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-company-name'>
                Company name <RequiredMark />
              </FieldLabel>
              <Input
                id='gs-company-name'
                placeholder='Cargorix Logistics Inc.'
                aria-invalid={fieldState.invalid}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='supportEmail'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-support-email'>
                Support email <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon align='inline-start'>
                  <MailIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id='gs-support-email'
                  placeholder='support@cargorix.com'
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='phone'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-phone'>
                Phone number <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon align='inline-start'>
                  <PhoneIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id='gs-phone'
                  placeholder='+1 (555) 014-2280'
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='website'
          control={control}
          render={({ field, fieldState }) => (
            <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-website'>
                Website <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon align='inline-start'>
                  <GlobeIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id='gs-website'
                  placeholder='https://www.cargorix.com'
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='address'
          control={control}
          render={({ field, fieldState }) => (
            <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-address'>
                Company address <RequiredMark />
              </FieldLabel>
              <Textarea
                id='gs-address'
                rows={3}
                placeholder='4400 Commerce Parkway&#10;Dallas, TX 75201&#10;United States'
                aria-invalid={fieldState.invalid}
                {...field}
              />
              <FieldDescription>This address will appear on documents and official communications.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='taxId'
          control={control}
          render={({ field, fieldState }) => (
            <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-tax-id'>
                Tax ID / EIN <RequiredMark />
              </FieldLabel>
              <Input id='gs-tax-id' placeholder='84-3120945' aria-invalid={fieldState.invalid} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default CompanyInformationCard
