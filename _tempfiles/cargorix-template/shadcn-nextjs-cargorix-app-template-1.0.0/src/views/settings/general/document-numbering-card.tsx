// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { HashIcon } from 'lucide-react'

// Type Imports
import type { GeneralSettingsFormInput } from './general-settings-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

const PREFIX_FIELDS = [
  { name: 'orderPrefix', label: 'Order prefix', id: 'gs-order-prefix', placeholder: 'ORD-' },
  { name: 'shipmentPrefix', label: 'Shipment prefix', id: 'gs-shipment-prefix', placeholder: 'SHP-' },
  { name: 'poPrefix', label: 'Purchase order prefix', id: 'gs-po-prefix', placeholder: 'PO-' },
  { name: 'transferPrefix', label: 'Stock transfer prefix', id: 'gs-transfer-prefix', placeholder: 'TRF-' },
  { name: 'adjustmentPrefix', label: 'Stock adjustment prefix', id: 'gs-adjustment-prefix', placeholder: 'ADJ-' }
] as const

// Props
type DocumentNumberingCardProps = {
  control: Control<GeneralSettingsFormInput>
}

const DocumentNumberingCard = ({ control }: DocumentNumberingCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <span className='bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <HashIcon className='size-4' />
          </span>
          Document Numbering
        </CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6'>
        {PREFIX_FIELDS.map(prefixField => (
          <Controller
            key={prefixField.name}
            name={prefixField.name}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor={prefixField.id}>
                  {prefixField.label} <RequiredMark />
                </FieldLabel>
                <Input
                  id={prefixField.id}
                  placeholder={prefixField.placeholder}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        ))}

        <FieldDescription>Prefixes will be used before the auto-generated sequential numbers.</FieldDescription>
      </CardContent>
    </Card>
  )
}

export default DocumentNumberingCard
