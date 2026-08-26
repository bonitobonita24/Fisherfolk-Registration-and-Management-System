// Type Imports
import type { ActivityEvent, ActivityModule, ActivityResult } from '@/types/pages/activity-log'
import type { User } from '@/types/entities/user'

// Data Imports
import { db as ordersDb } from '@/fake-db/entities/orders'
import { db as purchaseOrdersDb } from '@/fake-db/entities/purchase-orders'
import { db as shipmentsDb } from '@/fake-db/entities/shipments'
import { db as stockAdjustmentsDb } from '@/fake-db/entities/stock-adjustments'
import { db as usersDb } from '@/fake-db/entities/users'
import { db as warehousesDb } from '@/fake-db/entities/warehouses'

const ANCHOR = new Date('2026-08-05T18:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const MINUTE = 60 * 1000
const WINDOW_HOURS = 12

const DAY_COUNTS = [12, 11, 10, 10, 9, 9, 9, 9, 9, 9, 8, 8, 8, 7]

const FAILED_SLOTS = new Set([3, 9, 41, 76, 110])
const WARNING_SLOTS = new Set([1, 6, 17, 25, 38, 50, 63, 81, 97, 115])

const IP_BLOCKS = ['203.0.113', '198.51.100', '192.0.2']
const USER_DEVICES = ['Chrome / Windows', 'Edge / Windows', 'Safari / macOS', 'Chrome / macOS', 'Mobile / iOS']
const SYSTEM_DEVICE = 'Service / API'

const WORKSPACE_RECORDS = [
  'Workspace settings',
  'Notification preferences',
  'API key: Production',
  'Data retention policy',
  'Billing profile'
]

type RecordSource =
  | 'order'
  | 'purchaseOrder'
  | 'shipment'
  | 'adjustment'
  | 'warehouse'
  | 'teammate'
  | 'workspace'
  | 'account'

type Template = {
  action: string
  module: ActivityModule
  source: RecordSource
  result: ActivityResult
  actor: 'user' | 'system'
}

const SUCCESS_TEMPLATES: Template[] = [
  { action: 'Created purchase order', module: 'Purchasing', source: 'purchaseOrder', result: 'success', actor: 'user' },
  {
    action: 'Approved purchase order',
    module: 'Purchasing',
    source: 'purchaseOrder',
    result: 'success',
    actor: 'user'
  },
  {
    action: 'Sent purchase order to supplier',
    module: 'Purchasing',
    source: 'purchaseOrder',
    result: 'success',
    actor: 'user'
  },
  { action: 'Recorded goods receipt', module: 'Purchasing', source: 'purchaseOrder', result: 'success', actor: 'user' },
  {
    action: 'Updated purchase order lines',
    module: 'Purchasing',
    source: 'purchaseOrder',
    result: 'success',
    actor: 'user'
  },
  { action: 'Closed purchase order', module: 'Purchasing', source: 'purchaseOrder', result: 'success', actor: 'user' },
  { action: 'Created shipment', module: 'Shipments', source: 'shipment', result: 'success', actor: 'user' },
  { action: 'Dispatched shipment', module: 'Shipments', source: 'shipment', result: 'success', actor: 'user' },
  { action: 'Confirmed delivery', module: 'Shipments', source: 'shipment', result: 'success', actor: 'user' },
  { action: 'Generated shipping labels', module: 'Shipments', source: 'shipment', result: 'success', actor: 'user' },
  { action: 'Created order', module: 'Shipments', source: 'order', result: 'success', actor: 'user' },
  { action: 'Approved order', module: 'Shipments', source: 'order', result: 'success', actor: 'user' },
  { action: 'Released order to fulfilment', module: 'Shipments', source: 'order', result: 'success', actor: 'user' },
  { action: 'Updated delivery window', module: 'Shipments', source: 'order', result: 'success', actor: 'user' },
  { action: 'Posted stock adjustment', module: 'Inventory', source: 'adjustment', result: 'success', actor: 'user' },
  { action: 'Completed cycle count', module: 'Inventory', source: 'adjustment', result: 'success', actor: 'user' },
  { action: 'Wrote off damaged stock', module: 'Inventory', source: 'adjustment', result: 'success', actor: 'user' },
  {
    action: 'Recalculated reorder points',
    module: 'Inventory',
    source: 'warehouse',
    result: 'success',
    actor: 'system'
  },
  { action: 'Reconciled stock ledger', module: 'Inventory', source: 'warehouse', result: 'success', actor: 'system' },
  {
    action: 'Assigned driver to shipment',
    module: 'Transportation',
    source: 'shipment',
    result: 'success',
    actor: 'user'
  },
  { action: 'Reassigned vehicle', module: 'Transportation', source: 'shipment', result: 'success', actor: 'user' },
  {
    action: 'Optimised delivery route',
    module: 'Transportation',
    source: 'shipment',
    result: 'success',
    actor: 'user'
  },
  {
    action: 'Logged proof of delivery',
    module: 'Transportation',
    source: 'shipment',
    result: 'success',
    actor: 'user'
  },
  { action: 'Reserved dock window', module: 'Warehouse', source: 'warehouse', result: 'success', actor: 'user' },
  { action: 'Updated zone capacity', module: 'Warehouse', source: 'warehouse', result: 'success', actor: 'user' },
  { action: 'Published put-away plan', module: 'Warehouse', source: 'warehouse', result: 'success', actor: 'user' },
  {
    action: 'Changed warehouse operating hours',
    module: 'Warehouse',
    source: 'warehouse',
    result: 'success',
    actor: 'user'
  },
  { action: 'Invited team member', module: 'Administration', source: 'teammate', result: 'success', actor: 'user' },
  {
    action: 'Updated role permissions',
    module: 'Administration',
    source: 'workspace',
    result: 'success',
    actor: 'user'
  },
  {
    action: 'Updated notification preferences',
    module: 'Administration',
    source: 'workspace',
    result: 'success',
    actor: 'user'
  },
  { action: 'Rotated API key', module: 'Administration', source: 'workspace', result: 'success', actor: 'user' },
  {
    action: 'Synced orders from storefront',
    module: 'Integrations',
    source: 'order',
    result: 'success',
    actor: 'system'
  },
  {
    action: 'Pushed tracking update to carrier',
    module: 'Integrations',
    source: 'shipment',
    result: 'success',
    actor: 'system'
  },
  {
    action: 'Imported supplier price list',
    module: 'Integrations',
    source: 'purchaseOrder',
    result: 'success',
    actor: 'system'
  },
  { action: 'Signed in', module: 'Authentication', source: 'account', result: 'success', actor: 'user' },
  { action: 'Signed out', module: 'Authentication', source: 'account', result: 'success', actor: 'user' },
  {
    action: 'Enabled two-factor authentication',
    module: 'Authentication',
    source: 'account',
    result: 'success',
    actor: 'user'
  }
]

const WARNING_TEMPLATES: Template[] = [
  {
    action: 'Purchase order received short',
    module: 'Purchasing',
    source: 'purchaseOrder',
    result: 'warning',
    actor: 'user'
  },
  { action: 'Shipment delayed at hub', module: 'Shipments', source: 'shipment', result: 'warning', actor: 'system' },
  {
    action: 'Delivery attempt unsuccessful',
    module: 'Shipments',
    source: 'shipment',
    result: 'warning',
    actor: 'user'
  },
  {
    action: 'Low stock threshold breached',
    module: 'Inventory',
    source: 'warehouse',
    result: 'warning',
    actor: 'system'
  },
  {
    action: 'Stock adjustment exceeded tolerance',
    module: 'Inventory',
    source: 'adjustment',
    result: 'warning',
    actor: 'user'
  },
  {
    action: 'Driver assignment overridden',
    module: 'Transportation',
    source: 'shipment',
    result: 'warning',
    actor: 'user'
  },
  { action: 'Dock window double-booked', module: 'Warehouse', source: 'warehouse', result: 'warning', actor: 'user' },
  {
    action: 'Bulk import completed with skipped rows',
    module: 'Integrations',
    source: 'order',
    result: 'warning',
    actor: 'system'
  },
  { action: 'Password reset requested', module: 'Authentication', source: 'account', result: 'warning', actor: 'user' },
  {
    action: 'Sign-in from unrecognised device',
    module: 'Authentication',
    source: 'account',
    result: 'warning',
    actor: 'user'
  }
]

const FAILED_TEMPLATES: Template[] = [
  { action: 'Failed sign-in attempt', module: 'Authentication', source: 'account', result: 'failed', actor: 'user' },
  {
    action: 'Two-factor challenge failed',
    module: 'Authentication',
    source: 'account',
    result: 'failed',
    actor: 'user'
  },
  { action: 'Carrier API sync failed', module: 'Integrations', source: 'shipment', result: 'failed', actor: 'system' },
  {
    action: 'Account locked after repeated failures',
    module: 'Authentication',
    source: 'account',
    result: 'failed',
    actor: 'user'
  },
  {
    action: 'Sign-in blocked by IP policy',
    module: 'Authentication',
    source: 'account',
    result: 'failed',
    actor: 'user'
  }
]

const orderPool = ordersDb.filter(order => !order.isDraft && !order.id.startsWith('ord-hist-'))
const purchaseOrderPool = purchaseOrdersDb.filter(purchaseOrder => purchaseOrder.status !== 'draft')
const shipmentPool = shipmentsDb.filter(shipment => !shipment.id.startsWith('shp-hist-'))
const adjustmentPool = stockAdjustmentsDb.filter(adjustment => adjustment.status !== 'draft')
const activeUsers = usersDb.filter(user => user.status === 'active')

const buildTimestamps = (): string[] => {
  const stamps: string[] = []

  for (let day = 0; day < DAY_COUNTS.length; day++) {
    const count = DAY_COUNTS[day]
    const spacing = (WINDOW_HOURS * HOUR) / count

    for (let slot = 0; slot < count; slot++) {
      const jitter = (((day * 7 + slot * 13) % 31) - 15) * MINUTE

      stamps.push(new Date(ANCHOR - day * DAY - slot * spacing + jitter).toISOString())
    }
  }

  return stamps
}

const ipFor = (seed: number) => `${IP_BLOCKS[seed % IP_BLOCKS.length]}.${((seed * 13) % 240) + 5}`

const resolveRecord = (
  source: RecordSource,
  cursor: number,
  actor: User | null
): { record: string; recordHref: string | null } => {
  switch (source) {
    case 'order': {
      const order = orderPool[(cursor * 7) % orderPool.length]

      return { record: order.displayId, recordHref: `/orders/${order.id}` }
    }

    case 'purchaseOrder': {
      const purchaseOrder = purchaseOrderPool[(cursor * 5) % purchaseOrderPool.length]

      return { record: purchaseOrder.number, recordHref: `/purchase-orders/${purchaseOrder.id}` }
    }

    case 'shipment': {
      const shipment = shipmentPool[(cursor * 3) % shipmentPool.length]

      return { record: shipment.displayId, recordHref: `/shipments/${shipment.id}` }
    }

    case 'adjustment': {
      const adjustment = adjustmentPool[(cursor * 5) % adjustmentPool.length]

      return { record: adjustment.number, recordHref: `/stock-adjustments/${adjustment.id}` }
    }

    case 'warehouse': {
      const warehouse = warehousesDb[cursor % warehousesDb.length]

      return { record: warehouse.name, recordHref: `/warehouses/${warehouse.id}` }
    }

    case 'teammate': {
      const teammate = usersDb[(cursor * 5) % usersDb.length]

      return { record: teammate.name, recordHref: null }
    }

    case 'workspace':
      return { record: WORKSPACE_RECORDS[cursor % WORKSPACE_RECORDS.length], recordHref: null }
    default:
      return { record: actor?.email ?? 'service@cargorix.com', recordHref: null }
  }
}

const buildEvents = (): ActivityEvent[] => {
  const stamps = buildTimestamps()
  const events: ActivityEvent[] = []

  const recordCursors: Record<RecordSource, number> = {
    order: 0,
    purchaseOrder: 0,
    shipment: 0,
    adjustment: 0,
    warehouse: 0,
    teammate: 0,
    workspace: 0,
    account: 0
  }

  let successCursor = 0
  let warningCursor = 0
  let failedCursor = 0
  let userCursor = 0

  for (let index = 0; index < stamps.length; index++) {
    let template: Template

    if (FAILED_SLOTS.has(index)) {
      template = FAILED_TEMPLATES[failedCursor % FAILED_TEMPLATES.length]
      failedCursor++
    } else if (WARNING_SLOTS.has(index)) {
      template = WARNING_TEMPLATES[warningCursor % WARNING_TEMPLATES.length]
      warningCursor++
    } else {
      template = SUCCESS_TEMPLATES[(successCursor * 11) % SUCCESS_TEMPLATES.length]
      successCursor++
    }

    const isSystem = template.actor === 'system'
    const actor = isSystem ? null : activeUsers[(userCursor * 7) % activeUsers.length]

    if (!isSystem) userCursor++

    const actorSeed = actor ? usersDb.findIndex(user => user.id === actor.id) : index
    const { record, recordHref } = resolveRecord(template.source, recordCursors[template.source], actor)

    recordCursors[template.source]++

    events.push({
      id: `act-${String(index + 1).padStart(3, '0')}`,
      at: stamps[index],
      userId: actor?.id ?? null,
      userName: actor?.name ?? 'System',
      action: template.action,
      module: template.module,
      record,
      recordHref,
      result: template.result,
      ip: isSystem ? `192.0.2.${((index * 7) % 60) + 10}` : ipFor(actorSeed),
      device: isSystem ? SYSTEM_DEVICE : USER_DEVICES[actorSeed % USER_DEVICES.length]
    })
  }

  return events
}

export const db: ActivityEvent[] = buildEvents()
