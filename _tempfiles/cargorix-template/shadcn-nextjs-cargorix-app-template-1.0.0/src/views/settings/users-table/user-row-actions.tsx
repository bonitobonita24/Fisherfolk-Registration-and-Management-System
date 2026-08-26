'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { CirclePauseIcon, CirclePlayIcon, MailIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { User } from '@/types/entities/user'

// Component Imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Store Imports
import { useUsersStore } from '@/store/use-users-store'

type UserRowActionsProps = {
  user: User
  onEditUser?: (id: string) => void
}

const UserRowActions = ({ user, onEditUser }: UserRowActionsProps) => {
  // States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Hooks
  const setUserStatus = useUsersStore(state => state.setUserStatus)
  const deleteUser = useUsersStore(state => state.deleteUser)

  // Vars
  const isSuspended = user.status === 'suspended'

  const handleToggleStatus = () => {
    setUserStatus(user.id, isSuspended ? 'active' : 'suspended')
  }

  const handleResendInvite = () => {
    toast.success(`Invitation resent to ${user.email}`)
  }

  const handleDelete = () => {
    deleteUser(user.id)
    setIsDeleteConfirmOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' aria-label='User actions' />}>
          <MoreHorizontalIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-fit'>
          {onEditUser && (
            <DropdownMenuItem onClick={() => onEditUser(user.id)}>
              <PencilIcon data-icon='inline-start' />
              Edit user
            </DropdownMenuItem>
          )}
          {user.status === 'invited' && (
            <DropdownMenuItem onClick={handleResendInvite}>
              <MailIcon data-icon='inline-start' />
              Resend invite
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleToggleStatus}>
            {isSuspended ? <CirclePlayIcon data-icon='inline-start' /> : <CirclePauseIcon data-icon='inline-start' />}
            {isSuspended ? 'Activate user' : 'Suspend user'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteConfirmOpen(true)}>
            <Trash2Icon data-icon='inline-start' />
            Remove user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {user.name} ({user.email}) from the workspace and revokes their access immediately. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove user</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default UserRowActions
