// Type Imports
import type {
  DriverDocType,
  DriverEmploymentStatus,
  DriverShift,
  DriverType,
  HomeTime,
  LicenseClass,
  PayType
} from '@/types/entities/driver'
import { DRIVER_EMPLOYMENT_STATUS_LIST } from '@/types/entities/driver'

export const DRIVER_STATUS_BADGE: Record<DriverEmploymentStatus, { label: string; className: string; dot: string }> = {
  active: { label: 'Active', className: 'bg-success-soft text-success', dot: 'bg-success' },
  on_break: { label: 'On Break', className: 'bg-info-soft text-info', dot: 'bg-info' },
  unavailable: { label: 'Unavailable', className: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' }
}

export const DRIVER_STATUS_OPTIONS: { label: string; value: DriverEmploymentStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...DRIVER_EMPLOYMENT_STATUS_LIST.map(status => ({ label: DRIVER_STATUS_BADGE[status].label, value: status }))
]

export const DRIVER_STATUS_FILTER_OPTIONS: { label: string; value: DriverEmploymentStatus | 'draft' | 'all' }[] = [
  ...DRIVER_STATUS_OPTIONS,
  { label: 'Draft', value: 'draft' }
]

export const LICENSE_CLASS_LABEL: Record<LicenseClass, string> = {
  class_a: 'Class A',
  class_b: 'Class B',
  class_c: 'Class C'
}

export const DRIVER_TYPE_LABEL: Record<DriverType, string> = {
  otr: 'OTR (Over the Road)',
  regional: 'Regional',
  local: 'Local',
  dedicated: 'Dedicated'
}

export const SHIFT_LABEL: Record<DriverShift, string> = {
  day: 'Day Shift',
  night: 'Night Shift'
}

export const PAY_TYPE_LABEL: Record<PayType, string> = {
  per_mile: 'Per Mile',
  hourly: 'Hourly',
  salary: 'Salary',
  percentage: 'Percentage'
}

export const HOME_TIME_LABEL: Record<HomeTime, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly'
}

export const DOC_TYPE_LABEL: Record<DriverDocType, string> = {
  license: "Driver's License",
  medical_card: 'Medical Card',
  background_check: 'Background Check',
  drug_test: 'Drug Test'
}
