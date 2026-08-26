'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'

const ClientsHeader = () => {
  // Hooks
  const router = useRouter()

  const handleAddClient = () => {
    const id = crypto.randomUUID()

    useClientsStore.getState().createDraftClient(id)
    router.push(`/clients/create/${id}`)
  }

  return (
    <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Clients</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Manage client accounts, orders, shipments, and account value.
        </p>
      </div>
      <Button className='gap-2' onClick={handleAddClient}>
        <PlusIcon className='size-4' />
        Add client
      </Button>
    </div>
  )
}

export default ClientsHeader
