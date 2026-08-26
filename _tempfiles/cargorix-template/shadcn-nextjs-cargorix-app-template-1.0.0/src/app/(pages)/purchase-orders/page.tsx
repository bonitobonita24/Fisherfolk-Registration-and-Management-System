// Component Imports
import PurchaseOrdersView from '@/views/purchase-orders'

// Server Action Imports
import { getPurchaseOrdersData } from '@/app/server/actions'

const PurchaseOrdersPage = async () => {
  const purchaseOrders = await getPurchaseOrdersData()

  return <PurchaseOrdersView purchaseOrders={purchaseOrders} />
}

export default PurchaseOrdersPage
