// Component Imports
import SuppliersView from '@/views/suppliers'

// Server Action Imports
import { getPurchaseOrdersData, getSuppliersData } from '@/app/server/actions'

const SuppliersPage = async () => {
  const [suppliers, purchaseOrders] = await Promise.all([getSuppliersData(), getPurchaseOrdersData()])

  return <SuppliersView suppliers={suppliers} purchaseOrders={purchaseOrders} />
}

export default SuppliersPage
