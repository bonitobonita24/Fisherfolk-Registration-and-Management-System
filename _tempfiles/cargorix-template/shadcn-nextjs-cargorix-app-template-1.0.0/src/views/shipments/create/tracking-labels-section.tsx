// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateShipmentFormInput } from './create-shipment-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const TOGGLE_FIELDS = [
  {
    name: 'generateLabels' as const,
    title: 'Generate package labels',
    description: 'Create barcode, shipment ID and route code for each package.'
  },
  {
    name: 'sendTrackingLink' as const,
    title: 'Send customer tracking link',
    description: 'Notify sender and receiver when the shipment is dispatched.'
  },
  {
    name: 'requireProofOfDelivery' as const,
    title: 'Require proof of delivery',
    description: 'Collect recipient name, signature, photo and delivery timestamp.'
  }
]

type TrackingLabelsSectionProps = {
  control: Control<CreateShipmentFormInput>
}

const TrackingLabelsSection = ({ control }: TrackingLabelsSectionProps) => {
  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='border-b p-4'>
        <CardTitle>Tracking & labels</CardTitle>
        <p className='text-muted-foreground text-sm'>What gets generated and sent when this shipment dispatches</p>
      </CardHeader>
      <CardContent className='space-y-3 p-4'>
        {TOGGLE_FIELDS.map(toggle => (
          <Controller
            key={toggle.name}
            name={toggle.name}
            control={control}
            render={({ field }) => (
              <Label className='flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 font-normal'>
                <span>
                  <span className='block text-sm font-semibold'>{toggle.title}</span>
                  <span className='text-muted-foreground mt-1 block text-xs'>{toggle.description}</span>
                </span>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </Label>
            )}
          />
        ))}

        <Controller
          name='driverInstructions'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='driver-instructions'>Driver instructions</FieldLabel>
              <Textarea
                id='driver-instructions'
                rows={3}
                placeholder='Loading access, arrival contact, package sequence or special instructions'
                {...field}
              />
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default TrackingLabelsSection
