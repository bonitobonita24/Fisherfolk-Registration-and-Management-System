// Component Imports
import CreateOrderView from '@/views/orders/create'

// Server Action Imports
import { getClientsData, getOrdersData, getWarehousesData } from '@/app/server/actions'

type CreateOrderPageProps = {
  params: Promise<{ orderId: string }>
}

const CreateOrderPage = async ({ params }: CreateOrderPageProps) => {
  const { orderId } = await params

  const [clients, warehouses, orders] = await Promise.all([getClientsData(), getWarehousesData(), getOrdersData()])

  return <CreateOrderView orderId={orderId} clients={clients} warehouses={warehouses} orders={orders} />
}

export default CreateOrderPage
