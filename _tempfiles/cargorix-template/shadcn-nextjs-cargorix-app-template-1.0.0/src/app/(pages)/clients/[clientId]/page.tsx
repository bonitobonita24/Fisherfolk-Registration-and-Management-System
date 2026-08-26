// Component Imports
import ClientDetailView from '@/views/clients/detail'

// Server Action Imports
import { getClientsData, getOrdersData, getShipmentsData } from '@/app/server/actions'

type ClientDetailPageProps = {
  params: Promise<{ clientId: string }>
}

const ClientDetailPage = async ({ params }: ClientDetailPageProps) => {
  const { clientId } = await params

  const [clients, orders, shipments] = await Promise.all([getClientsData(), getOrdersData(), getShipmentsData()])

  return <ClientDetailView clientId={clientId} clients={clients} orders={orders} shipments={shipments} />
}

export default ClientDetailPage
