'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { CircleMinusIcon, CirclePauseIcon, CirclePlayIcon, EyeIcon, MoreHorizontalIcon, PencilIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'

type ClientRowActionsProps = {
  client: Client
}

const ClientRowActions = ({ client }: ClientRowActionsProps) => {
  // Vars
  const updateClient = useClientsStore(state => state.updateClient)
  const isOnHold = client.status === 'on_hold'

  // Hooks
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' className='size-8' aria-label='Client actions' />}
      >
        <MoreHorizontalIcon className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-fit'>
        <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
          <EyeIcon data-icon='inline-start' />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/clients/create/${client.id}`)}>
          <PencilIcon data-icon='inline-start' />
          Edit client
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => updateClient(client.id, { status: isOnHold ? 'active' : 'on_hold' })}>
          {isOnHold ? <CirclePlayIcon data-icon='inline-start' /> : <CirclePauseIcon data-icon='inline-start' />}
          {isOnHold ? 'Set active' : 'Set on hold'}
        </DropdownMenuItem>
        <DropdownMenuItem variant='destructive' onClick={() => updateClient(client.id, { status: 'inactive' })}>
          <CircleMinusIcon data-icon='inline-start' />
          Deactivate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ClientRowActions
