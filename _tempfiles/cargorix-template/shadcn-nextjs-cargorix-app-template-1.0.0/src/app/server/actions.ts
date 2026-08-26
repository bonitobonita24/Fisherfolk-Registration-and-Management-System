'use server'

// Data Imports
import { orderKpiTrends as orderKpiTrendsDb } from '@/fake-db/pages/orders'
import { db as operationsOverviewDb } from '@/fake-db/dashboards/operations-overview'
import { db as inventoryOverviewDb } from '@/fake-db/dashboards/inventory-overview'
import { db as clientsDb } from '@/fake-db/entities/clients'
import { db as driversDb } from '@/fake-db/entities/drivers'
import { db as ordersDb } from '@/fake-db/entities/orders'
import { db as productsDb } from '@/fake-db/entities/products'
import { db as shipmentsDb } from '@/fake-db/entities/shipments'
import { db as suppliersDb } from '@/fake-db/entities/suppliers'
import { db as vehiclesDb } from '@/fake-db/entities/vehicles'
import { db as warehousesDb } from '@/fake-db/entities/warehouses'
import { db as stockLedgerDb } from '@/fake-db/entities/stock-movements'
import { db as purchaseOrdersDb } from '@/fake-db/entities/purchase-orders'
import { db as stockTransfersDb } from '@/fake-db/entities/stock-transfers'
import { db as stockAdjustmentsDb } from '@/fake-db/entities/stock-adjustments'
import { db as routesDb } from '@/fake-db/entities/routes'
import { db as generalSettingsDb } from '@/fake-db/pages/general-settings'
import { db as rolesDb } from '@/fake-db/entities/roles'
import { db as notificationSettingsDb } from '@/fake-db/pages/notification-settings'
import { db as usersDb } from '@/fake-db/entities/users'
import { db as activityLogDb } from '@/fake-db/pages/activity-log'

// Operations Overview Actions
export const getOperationsOverviewData = async () => {
  return operationsOverviewDb
}

// Inventory Overview Actions
export const getInventoryOverviewData = async () => {
  return inventoryOverviewDb
}

// Products Actions
export const getProductsData = async () => {
  return productsDb
}

// Stock Ledger Actions
export const getStockLedgerData = async () => {
  return stockLedgerDb
}

// Purchase Orders Actions
export const getPurchaseOrdersData = async () => {
  return purchaseOrdersDb
}

// Stock Transfers Actions
export const getStockTransfersData = async () => stockTransfersDb

// Stock Adjustments Actions
export const getStockAdjustmentsData = async () => stockAdjustmentsDb

// Warehouses Actions
export const getWarehousesData = async () => {
  return warehousesDb
}

// Suppliers Actions
export const getSuppliersData = async () => {
  return suppliersDb
}

// Clients Actions
export const getClientsData = async () => {
  return clientsDb
}

// Orders Actions
export const getOrdersData = async () => {
  return ordersDb
}

export const getOrderKpiTrendsData = async () => {
  return orderKpiTrendsDb
}

// Shipments Actions
export const getShipmentsData = async () => {
  return shipmentsDb
}

export const getDriversData = async () => {
  return driversDb
}

export const getVehiclesData = async () => {
  return vehiclesDb
}

// Route Planner Actions
export const getRoutesData = async () => routesDb

// General Settings Actions
export const getGeneralSettingsData = async () => generalSettingsDb

// Roles & Permissions Actions
export const getRolesData = async () => rolesDb

// Notification Settings Actions
export const getNotificationSettingsData = async () => notificationSettingsDb

// Users Actions
export const getUsersData = async () => usersDb

// Activity Log Actions
export const getActivityLogData = async () => activityLogDb
