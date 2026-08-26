// Component Imports
import ClientsView from '@/views/clients'

// Server Action Imports
import { getClientsData, getOrdersData, getShipmentsData } from '@/app/server/actions'

const ClientsPage = async () => {
  const [clients, orders, shipments] = await Promise.all([getClientsData(), getOrdersData(), getShipmentsData()])

  return <ClientsView clients={clients} orders={orders} shipments={shipments} />
}

export default ClientsPage
