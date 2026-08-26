// Third-party Imports
import { Controller, useFieldArray, useFormState, type Control } from 'react-hook-form'
import { PlusIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { CreateOrderFormInput } from './create-order-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const EMPTY_PACKAGE = {
  description: '',
  quantity: 1,
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: ''
}

const DIMENSION_FIELDS = [
  { name: 'lengthCm', placeholder: 'L', label: 'Length in cm' },
  { name: 'widthCm', placeholder: 'W', label: 'Width in cm' },
  { name: 'heightCm', placeholder: 'H', label: 'Height in cm' }
] as const

type PackagesSectionProps = {
  control: Control<CreateOrderFormInput>
}

const PackagesSection = ({ control }: PackagesSectionProps) => {
  // Hooks
  const { fields, append, remove } = useFieldArray({ control, name: 'packages' })
  const { errors } = useFormState({ control, name: 'packages' })

  return (
    <div className='space-y-4'>
      <div className='divide-y'>
        {fields.map((packageField, index) => (
          <div key={packageField.id} className='flex flex-wrap gap-3 py-4 first:pt-0 last:pb-0'>
            <Controller
              name={`packages.${index}.description`}
              control={control}
              render={({ field, fieldState }) => (
                <Field className='min-w-48 flex-1' data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`package-${index}-description`}>Description</FieldLabel>
                  <Input id={`package-${index}-description`} placeholder='Item description' {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={`packages.${index}.quantity`}
              control={control}
              render={({ field, fieldState }) => (
                <Field className='w-20' data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`package-${index}-quantity`}>Quantity</FieldLabel>
                  <Input
                    id={`package-${index}-quantity`}
                    type='number'
                    min={1}
                    step={1}
                    onKeyDown={event => {
                      if (['.', ',', '-'].includes(event.key)) event.preventDefault()
                    }}
                    {...field}
                    value={field.value as string | number}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name={`packages.${index}.weightKg`}
              control={control}
              render={({ field, fieldState }) => (
                <Field className='w-24' data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`package-${index}-weight`}>Weight (kg)</FieldLabel>
                  <Input
                    id={`package-${index}-weight`}
                    type='number'
                    min={0}
                    step='0.1'
                    placeholder='0'
                    {...field}
                    value={field.value as string | number}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field className='w-auto'>
              <FieldLabel htmlFor={`package-${index}-lengthCm`}>Dimensions (L × W × H)</FieldLabel>
              <div className='flex gap-2'>
                {DIMENSION_FIELDS.map(dimension => (
                  <Controller
                    key={dimension.name}
                    name={`packages.${index}.${dimension.name}`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        id={`package-${index}-${dimension.name}`}
                        type='number'
                        min={0}
                        className='w-16'
                        placeholder={dimension.placeholder}
                        aria-label={dimension.label}
                        {...field}
                        value={field.value as string | number}
                      />
                    )}
                  />
                ))}
              </div>
            </Field>

            <div className='flex items-center'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={`Remove package ${index + 1}`}
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <Trash2Icon className='size-4' />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {errors.packages?.root && <FieldError errors={[errors.packages.root]} />}

      <Button
        type='button'
        variant='ghost'
        size='lg'
        className='border-border w-full border border-dashed'
        onClick={() => append(EMPTY_PACKAGE)}
      >
        <PlusIcon className='size-4' />
        Add item
      </Button>
    </div>
  )
}

export default PackagesSection
