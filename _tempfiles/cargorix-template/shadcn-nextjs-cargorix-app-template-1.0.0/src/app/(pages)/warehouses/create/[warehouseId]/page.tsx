// Component Imports
import CreateWarehouseView from '@/views/warehouses/create'

// Server Action Imports
import { getStockLedgerData, getUsersData, getWarehousesData } from '@/app/server/actions'

type CreateWarehousePageProps = {
  params: Promise<{ warehouseId: string }>
}

const CreateWarehousePage = async ({ params }: CreateWarehousePageProps) => {
  const { warehouseId } = await params

  const [warehouses, users, movements] = await Promise.all([getWarehousesData(), getUsersData(), getStockLedgerData()])

  return <CreateWarehouseView warehouseId={warehouseId} warehouses={warehouses} users={users} movements={movements} />
}

export default CreateWarehousePage
