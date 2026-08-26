// Type Imports
import type { AlertCategory, NotificationSettings } from '@/types/pages/notification-settings'

const categories: AlertCategory[] = [
  {
    id: 'shipment-delays',
    label: 'Shipment Delays',
    description: 'A shipment falls behind its promised delivery window.',
    icon: 'truck',
    inApp: true,
    email: true,
    sms: true,
    priority: 'high'
  },
  {
    id: 'failed-deliveries',
    label: 'Failed Deliveries',
    description: 'A delivery attempt fails or a shipment is returned.',
    icon: 'package-x',
    inApp: true,
    email: true,
    sms: true,
    priority: 'high'
  },
  {
    id: 'low-stock-alerts',
    label: 'Low Stock Alerts',
    description: 'On-hand quantity drops below a product reorder point.',
    icon: 'package-search',
    inApp: true,
    email: true,
    sms: false,
    priority: 'medium'
  },
  {
    id: 'purchase-order-receipts',
    label: 'Purchase Order Receipts',
    description: 'A purchase order is partially or fully received.',
    icon: 'clipboard-check',
    inApp: true,
    email: true,
    sms: false,
    priority: 'medium'
  },
  {
    id: 'transfer-completed',
    label: 'Transfer Completed',
    description: 'A stock transfer is received at its destination warehouse.',
    icon: 'arrow-left-right',
    inApp: true,
    email: false,
    sms: false,
    priority: 'low'
  },
  {
    id: 'route-delays',
    label: 'Route Delays',
    description: 'A dispatched route slips behind its planned schedule.',
    icon: 'route',
    inApp: true,
    email: true,
    sms: true,
    priority: 'high'
  },
  {
    id: 'vehicle-maintenance-due',
    label: 'Vehicle Maintenance Due',
    description: 'A vehicle reaches its next service date or mileage.',
    icon: 'wrench',
    inApp: true,
    email: true,
    sms: false,
    priority: 'medium'
  },
  {
    id: 'driver-license-expiry',
    label: 'Driver License Expiry',
    description: 'A driver licence or medical certificate is close to expiring.',
    icon: 'id-card',
    inApp: true,
    email: true,
    sms: true,
    priority: 'high'
  },
  {
    id: 'warehouse-capacity-warning',
    label: 'Warehouse Capacity Warning',
    description: 'A warehouse crosses its utilisation threshold.',
    icon: 'warehouse',
    inApp: true,
    email: true,
    sms: false,
    priority: 'medium'
  },
  {
    id: 'daily-summary-reports',
    label: 'Daily Summary Reports',
    description: 'A rollup of orders, shipments and inventory movement.',
    icon: 'file-text',
    inApp: true,
    email: true,
    sms: false,
    priority: 'low',
    frequency: 'daily',
    sendAt: '08:00'
  }
]

export const db: NotificationSettings = {
  channels: {
    inApp: true,
    email: true,
    sms: true
  },
  categories,
  quietHours: {
    from: '22:00',
    to: '07:00',
    allowHighPriority: true
  },
  digest: {
    frequency: 'daily',
    sendAt: '08:00',
    include: 'all'
  }
}
