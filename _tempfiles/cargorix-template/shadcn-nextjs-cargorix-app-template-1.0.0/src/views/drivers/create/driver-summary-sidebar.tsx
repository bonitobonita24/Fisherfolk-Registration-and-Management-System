'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { AlertCircleIcon, CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { CreateDriverFormInput } from './driver-form-schema'
import type { Driver, DriverEmploymentStatus, DriverGender, DriverShift, LicenseClass } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { getComplianceScore, getComplianceStatusItems, getDriverReadiness } from '@/lib/selectors/drivers-selectors'
import { DRIVER_STATUS_BADGE, SHIFT_LABEL } from '../driver-badges'

// Vars
const PLACEHOLDER = '— — —'

// Props
type DriverSummarySidebarProps = {
  control: Control<CreateDriverFormInput>
  mode: 'add' | 'edit'
  driver?: Driver
  vehicles: Vehicle[]
  warehouses: Warehouse[]
}

const DriverSummarySidebar = ({ control, mode, driver, vehicles, warehouses }: DriverSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })

  // Vars
  const name = [values.firstName, values.lastName].filter(Boolean).join(' ').trim() || PLACEHOLDER

  const initials =
    `${values.firstName?.[0] ?? ''}${values.lastName?.[0] ?? ''}`.toUpperCase() || (driver?.initials ?? '—')

  const status = (values.employmentStatus as DriverEmploymentStatus) || 'inactive'
  const statusBadge = DRIVER_STATUS_BADGE[status] ?? DRIVER_STATUS_BADGE.inactive
  const assignedVehicle = vehicles.find(vehicle => vehicle.id === values.assignedVehicleId)
  const assignedVehicleLabel = assignedVehicle ? `${assignedVehicle.id} · ${assignedVehicle.label}` : PLACEHOLDER
  const shiftLabel = values.shift ? SHIFT_LABEL[values.shift as DriverShift] : PLACEHOLDER
  const hubName = warehouses.find(warehouse => warehouse.id === values.homeHubId)?.name ?? ''

  const readinessDraft: Partial<Driver> = {
    firstName: values.firstName,
    lastName: values.lastName,
    dob: values.dob,
    gender: (values.gender as DriverGender) || undefined,
    phone: values.phone,
    email: values.email,
    address: values.address,
    city: values.city,
    state: values.state,
    licenseNumber: values.licenseNumber,
    licenseClass: (values.licenseClass as LicenseClass) || undefined,
    licenseExpiry: values.licenseExpiry,
    licenseState: values.licenseState,
    medicalCardExpiry: values.medicalCardExpiry,
    homeHubId: values.homeHubId,
    shift: (values.shift as DriverShift) || undefined,
    employmentStatus: (values.employmentStatus as DriverEmploymentStatus) || undefined,
    emergencyContact: {
      name: values.emergencyName ?? '',
      relationship: values.emergencyRelationship ?? '',
      phone: values.emergencyPhone ?? '',
      altPhone: values.emergencyAltPhone
    },
    documents: []
  }

  const checklist = getDriverReadiness(readinessDraft)
  const assignment = driver?.currentAssignment
  const complianceItems = driver ? getComplianceStatusItems(driver) : []
  const complianceScore = driver ? getComplianceScore(driver) : 0

  const summaryRows = [
    { label: 'Driver ID', value: values.driverId || PLACEHOLDER },
    { label: 'Phone', value: values.phone || PLACEHOLDER },
    { label: 'Email', value: values.email || PLACEHOLDER },
    { label: 'Home Hub', value: hubName || PLACEHOLDER },
    { label: 'Assigned Vehicle', value: assignedVehicleLabel },
    { label: 'Operating Zone', value: values.operatingZone || PLACEHOLDER },
    { label: 'Shift', value: shiftLabel },
    { label: 'Status', value: statusBadge.label }
  ]

  return (
    <div className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-1'>
      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Driver summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 text-sm'>
          <div className='flex items-center gap-3'>
            <Avatar className='size-12'>
              <AvatarImage src={values.avatarUrl || undefined} alt={name} />
              <AvatarFallback className='bg-muted text-muted-foreground'>{initials}</AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='truncate font-medium'>{name}</p>
              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            </div>
          </div>
          <Separator />
          {summaryRows.map(row => (
            <div key={row.label} className='flex items-baseline justify-between gap-4'>
              <span className='text-muted-foreground'>{row.label}</span>
              <span className='truncate text-right font-medium'>{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {mode === 'add' && (
        <Card className='gap-0 py-0'>
          <CardHeader className='px-5 pt-5'>
            <CardTitle>Readiness checklist</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 p-4 text-sm'>
            <ul className='space-y-2'>
              {checklist.map(item => (
                <li key={item.label} className='flex items-center gap-2'>
                  {item.done ? (
                    <CheckCircle2Icon className='text-success size-4 shrink-0' />
                  ) : (
                    <CircleIcon className='text-muted-foreground size-4 shrink-0' />
                  )}
                  <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                </li>
              ))}
            </ul>
            <p className='text-muted-foreground text-xs'>
              Please complete all required fields and upload documents to add the driver.
            </p>
          </CardContent>
        </Card>
      )}

      {mode === 'edit' && (
        <Card className='gap-0 py-0'>
          <CardHeader className='px-5 pt-5'>
            <CardTitle>Current assignment</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 p-4 text-sm'>
            {assignment ? (
              <>
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>Route</span>
                  <span className='truncate text-right font-medium'>{assignment.routeName}</span>
                </div>
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>Shipment</span>
                  <span className='truncate text-right font-medium'>{assignment.shipmentId}</span>
                </div>
                <Separator />
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>Next stop</span>
                  <span className='truncate text-right font-medium'>{assignment.nextStop}</span>
                </div>
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>ETA</span>
                  <span className='truncate text-right font-medium'>{assignment.etaLabel}</span>
                </div>
              </>
            ) : (
              <p className='text-muted-foreground'>No active assignment.</p>
            )}
          </CardContent>
        </Card>
      )}

      {mode === 'edit' && driver && (
        <Card className='gap-0 py-0'>
          <CardHeader className='px-5 pt-5'>
            <CardTitle>Compliance status</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 p-4 text-sm'>
            <ul className='space-y-2'>
              {complianceItems.map(item => (
                <li key={item.label} className='flex items-center gap-2'>
                  {item.compliant ? (
                    <CheckCircle2Icon className='text-success size-4 shrink-0' />
                  ) : (
                    <AlertCircleIcon className='text-warning size-4 shrink-0' />
                  )}
                  <span className={item.compliant ? '' : 'text-muted-foreground'}>{item.label}</span>
                </li>
              ))}
            </ul>
            <div
              className={`flex items-center justify-between rounded-md p-3 ${
                complianceScore === 100 ? 'bg-success-soft' : 'bg-warning-soft'
              }`}
            >
              <span className='font-medium'>Overall Compliance Score</span>
              <span className='font-semibold'>{complianceScore}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DriverSummarySidebar
