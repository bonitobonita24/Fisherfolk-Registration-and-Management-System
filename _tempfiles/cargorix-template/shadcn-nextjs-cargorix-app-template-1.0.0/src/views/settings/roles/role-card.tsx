'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { MoreVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { Role } from '@/types/entities/role'
import { PERMISSION_KEY_LIST } from '@/types/entities/role'
import type { User } from '@/types/entities/user'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Util Imports
import { getUserCountByRole } from '@/lib/selectors/user-selectors'

type RoleCardProps = {
  role: Role
  users: User[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const RoleCard = ({ role, users, onEdit, onDelete }: RoleCardProps) => {
  // States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Vars
  const total = role.permissions.length

  const userCount = getUserCountByRole(users, role.id)

  const permissionCounts = PERMISSION_KEY_LIST.map(key => ({
    key,
    count: role.permissions.filter(permission => permission[key]).length
  }))

  const handleConfirmDelete = () => {
    onDelete(role.id)
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardContent className='flex flex-col gap-3'>
          <div className='flex justify-between gap-2'>
            <div className='min-w-0'>
              <h4 className='text-base leading-tight font-medium'>{role.name}</h4>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {userCount} {userCount === 1 ? 'user' : 'users'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' />}>
                <MoreVerticalIcon className='size-4' />
                <span className='sr-only'>More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-fit'>
                <DropdownMenuItem onClick={() => onEdit(role.id)}>
                  <PencilIcon className='size-4' />
                  Edit Role
                </DropdownMenuItem>
                <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2Icon className='size-4' />
                  Delete Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='bg-muted/50 flex items-center justify-between rounded-md px-3 py-2'>
            {permissionCounts.map(({ key, count }) => (
              <div key={key} className='flex flex-col items-center gap-0.5'>
                <span className='text-foreground text-sm font-semibold'>{count}</span>
                <span className='text-muted-foreground text-[10px] capitalize'>{key}</span>
              </div>
            ))}
            <div className='bg-border h-6 w-px' />
            <div className='flex flex-col items-center gap-0.5'>
              <span className='text-foreground text-sm font-semibold'>{total}</span>
              <span className='text-muted-foreground text-[10px]'>Total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the <strong>{role.name}</strong> role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RoleCard
