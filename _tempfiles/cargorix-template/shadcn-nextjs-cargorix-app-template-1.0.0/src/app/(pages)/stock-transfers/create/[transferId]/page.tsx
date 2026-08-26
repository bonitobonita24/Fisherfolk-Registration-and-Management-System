// Component Imports
import CreateStockTransferView from '@/views/stock-transfers/create'

// Server Action Imports
import { getProductsData, getStockLedgerData, getStockTransfersData, getWarehousesData } from '@/app/server/actions'

type CreateStockTransferPageProps = {
  params: Promise<{ transferId: string }>
}

const CreateStockTransferPage = async ({ params }: CreateStockTransferPageProps) => {
  const { transferId } = await params

  const [transfers, warehouses, products, movements] = await Promise.all([
    getStockTransfersData(),
    getWarehousesData(),
    getProductsData(),
    getStockLedgerData()
  ])

  return (
    <CreateStockTransferView
      transferId={transferId}
      transfers={transfers}
      warehouses={warehouses}
      products={products}
      movements={movements}
    />
  )
}

export default CreateStockTransferPage
