// Component Imports
import WarehouseDetailView from '@/views/warehouses/detail'

// Server Action Imports
import {
  getProductsData,
  getStockLedgerData,
  getStockTransfersData,
  getUsersData,
  getWarehousesData
} from '@/app/server/actions'

type WarehouseDetailPageProps = {
  params: Promise<{ warehouseId: string }>
}

const WarehouseDetailPage = async ({ params }: WarehouseDetailPageProps) => {
  const { warehouseId } = await params

  const [warehouses, products, movements, transfers, users] = await Promise.all([
    getWarehousesData(),
    getProductsData(),
    getStockLedgerData(),
    getStockTransfersData(),
    getUsersData()
  ])

  return (
    <WarehouseDetailView
      warehouseId={warehouseId}
      warehouses={warehouses}
      products={products}
      movements={movements}
      transfers={transfers}
      users={users}
    />
  )
}

export default WarehouseDetailPage
