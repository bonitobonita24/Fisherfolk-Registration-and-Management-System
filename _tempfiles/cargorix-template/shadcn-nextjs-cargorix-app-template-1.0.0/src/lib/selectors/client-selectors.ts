// Type Imports
import type { ExportTable } from '@/types'
import type { Client } from '@/types/entities/client'
import type { Order, OrderStatus } from '@/types/entities/order'
import type { Shipment, ShipmentStatus } from '@/types/entities/shipment'

// Util Imports
import { excludeDrafts } from '@/lib/exclude-drafts'

export interface ClientRollup {
  ordersCount: number
  activeShipments: number
  outstandingBalance: number
  lifetimeValue: number
}

export interface ClientsSummary {
  totalClients: number
  activeClients: number
  onHoldClients: number
  totalOutstanding: number
}

export interface ClientReadinessItem {
  label: string
  passed: boolean
}

export const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = ['scheduled', 'in_transit', 'out_for_delivery']

const OPEN_ORDER_STATUSES: OrderStatus[] = [
  'pending_review',
  'order_received',
  'ready_for_shipment',
  'in_fulfilment',
  'on_hold'
]

export const getClientOrders = (orders: Order[], clientId: string): Order[] =>
  excludeDrafts(orders)
    .filter(order => order.clientId === clientId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const getClientShipments = (shipments: Shipment[], orders: Order[], clientId: string): Shipment[] => {
  const orderIds = new Set(
    excludeDrafts(orders)
      .filter(order => order.clientId === clientId)
      .map(order => order.id)
  )

  return shipments
    .filter(shipment => orderIds.has(shipment.orderId))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const getClientRollup = (client: Client, orders: Order[], shipments: Shipment[]): ClientRollup => {
  const clientOrders = getClientOrders(orders, client.id)
  const billable = clientOrders.filter(order => order.status !== 'cancelled' && order.status !== 'draft')
  const open = clientOrders.filter(order => OPEN_ORDER_STATUSES.includes(order.status))

  const activeShipments = getClientShipments(shipments, orders, client.id).filter(shipment =>
    ACTIVE_SHIPMENT_STATUSES.includes(shipment.status)
  ).length

  return {
    ordersCount: (client.historicalOrders ?? 0) + billable.length,
    activeShipments,
    outstandingBalance: open.reduce((sum, order) => sum + order.totalAmount, 0),
    lifetimeValue: (client.historicalRevenue ?? 0) + billable.reduce((sum, order) => sum + order.totalAmount, 0)
  }
}

export const getClientsSummary = (clients: Client[], orders: Order[], shipments: Shipment[]): ClientsSummary => {
  const live = clients.filter(client => !client.isDraft)

  return {
    totalClients: live.length,
    activeClients: live.filter(client => client.status === 'active').length,
    onHoldClients: live.filter(client => client.status === 'on_hold').length,
    totalOutstanding: live.reduce(
      (sum, client) => sum + getClientRollup(client, orders, shipments).outstandingBalance,
      0
    )
  }
}

export const buildClientsExport = (clients: Client[], orders: Order[], shipments: Shipment[]): ExportTable => {
  const headers = [
    'Client',
    'Code',
    'Contact',
    'Email',
    'Phone',
    'Location',
    'Country',
    'Status',
    'Orders',
    'Active shipments',
    'Open order value',
    'Lifetime value',
    'Account manager'
  ]

  const rows = clients.map(client => {
    const rollup = getClientRollup(client, orders, shipments)

    return [
      client.name,
      client.clientCode ?? '',
      client.contactName,
      client.email,
      client.phone,
      [client.city, client.state].filter(Boolean).join(', '),
      client.country ?? '',
      client.status ?? 'inactive',
      `${rollup.ordersCount}`,
      `${rollup.activeShipments}`,
      rollup.outstandingBalance.toFixed(2),
      rollup.lifetimeValue.toFixed(2),
      client.accountManager ?? ''
    ]
  })

  return { headers, rows }
}

export const getClientReadiness = (draft: Partial<Client>, mode: 'add' | 'edit'): ClientReadinessItem[] => {
  const hasContact = Boolean(draft.contactName && draft.email && draft.phone)
  const hasBillingTerms = Boolean(draft.paymentTerms && draft.currency && draft.billingEmail)

  if (mode === 'add') {
    return [
      { label: 'Client name', passed: Boolean(draft.name && draft.clientCode) },
      { label: 'Primary contact information', passed: hasContact },
      { label: 'Billing address', passed: Boolean(draft.billingAddress) },
      { label: 'Payment terms', passed: Boolean(draft.paymentTerms) },
      { label: 'Account manager', passed: Boolean(draft.accountManager) }
    ]
  }

  return [
    { label: 'Client information', passed: Boolean(draft.name && draft.clientCode && draft.industry) },
    { label: 'Primary contact', passed: hasContact },
    { label: 'Billing address', passed: Boolean(draft.billingAddress) },
    { label: 'Shipping address', passed: Boolean(draft.shippingAddress) },
    { label: 'Billing & terms', passed: hasBillingTerms },
    { label: 'Additional information', passed: Boolean(draft.preferredServices?.length) },
    { label: 'Documents', passed: Boolean(draft.documents?.length) }
  ]
}
