// Component Imports
import CreateClientView from '@/views/clients/create'

// Server Action Imports
import { getClientsData, getOrdersData, getShipmentsData } from '@/app/server/actions'

type CreateClientPageProps = {
  params: Promise<{ clientId: string }>
}

const CreateClientPage = async ({ params }: CreateClientPageProps) => {
  const { clientId } = await params

  const [clients, orders, shipments] = await Promise.all([getClientsData(), getOrdersData(), getShipmentsData()])

  return <CreateClientView clientId={clientId} clients={clients} orders={orders} shipments={shipments} />
}

export default CreateClientPage
