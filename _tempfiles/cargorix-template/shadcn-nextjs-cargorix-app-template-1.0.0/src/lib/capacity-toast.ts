// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { WarehouseIntakeCheck } from '@/types/entities/warehouse'

// Util Imports
import { capacityBlockedMessage } from '@/lib/selectors/warehouse-selectors'

export const warnIfOverCapacity = (check: WarehouseIntakeCheck): boolean => {
  if (check.ok) return true

  toast.error('Not enough warehouse space', { description: capacityBlockedMessage(check) })

  return false
}
