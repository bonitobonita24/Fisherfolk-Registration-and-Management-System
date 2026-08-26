'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useSuppliersStore } from '@/store/use-suppliers-store'

const SuppliersHeader = () => {
  // Hooks
  const router = useRouter()

  const handleAddSupplier = () => {
    const id = crypto.randomUUID()

    useSuppliersStore.getState().createDraftSupplier(id)
    router.push(`/suppliers/create/${id}`)
  }

  return (
    <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Suppliers</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Manage supplier accounts, procurement activity, and purchasing relationships.
        </p>
      </div>
      <Button className='gap-2' onClick={handleAddSupplier}>
        <PlusIcon className='size-4' />
        Add supplier
      </Button>
    </div>
  )
}

export default SuppliersHeader
