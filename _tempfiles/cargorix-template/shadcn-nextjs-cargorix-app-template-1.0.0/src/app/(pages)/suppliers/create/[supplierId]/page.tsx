// Component Imports
import CreateSupplierView from '@/views/suppliers/create'

// Server Action Imports
import { getPurchaseOrdersData, getSuppliersData } from '@/app/server/actions'

type CreateSupplierPageProps = {
  params: Promise<{ supplierId: string }>
}

const CreateSupplierPage = async ({ params }: CreateSupplierPageProps) => {
  const { supplierId } = await params

  const [suppliers, purchaseOrders] = await Promise.all([getSuppliersData(), getPurchaseOrdersData()])

  return <CreateSupplierView supplierId={supplierId} suppliers={suppliers} purchaseOrders={purchaseOrders} />
}

export default CreateSupplierPage
