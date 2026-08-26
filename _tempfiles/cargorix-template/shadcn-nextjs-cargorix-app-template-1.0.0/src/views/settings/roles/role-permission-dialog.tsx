'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'

// Type Imports
import type { ResourcePermissions, Role, RoleDialogMode, RoleFormData } from '@/types/entities/role'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import RolePermissionsTable from './role-permissions-table'

// Data Imports
import type { RoleFormInput, RoleFormValues } from './role-form-schema'
import { roleFormSchema } from './role-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

const roleResolver = zodResolver as unknown as (
  schema: typeof roleFormSchema
) => Resolver<RoleFormInput, unknown, RoleFormValues>

const buildDefaultPermissions = (resources: string[]): ResourcePermissions[] =>
  resources.map(resource => ({ resource, read: false, write: false, create: false, delete: false }))

type RolePermissionDialogProps = {
  dialogMode: RoleDialogMode | null
  editingRole: Role | null
  permissionResources: string[]
  onAddRole: (data: RoleFormData) => void
  onUpdateRole: (id: string, data: RoleFormData) => void
  onClose: () => void
}

const RolePermissionDialog = ({
  dialogMode,
  editingRole,
  permissionResources,
  onAddRole,
  onUpdateRole,
  onClose
}: RolePermissionDialogProps) => {
  // Vars
  const open = dialogMode !== null
  const isEdit = dialogMode === 'edit'

  // Hooks
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors }
  } = useForm<RoleFormInput, unknown, RoleFormValues>({
    resolver: roleResolver(roleFormSchema),
    defaultValues: {
      name: '',
      permissions: buildDefaultPermissions(permissionResources)
    }
  })

  const onSubmit = (data: RoleFormValues) => {
    if (isEdit && editingRole) {
      onUpdateRole(editingRole.id, data)
    } else {
      onAddRole(data)
    }

    onClose()
  }

  useEffect(() => {
    if (dialogMode === 'add') {
      reset({ name: '', permissions: buildDefaultPermissions(permissionResources) })
    } else if (dialogMode === 'edit' && editingRole) {
      reset({ name: editingRole.name, permissions: editingRole.permissions })
    }
  }, [dialogMode, editingRole, permissionResources, reset])

  return (
    <Dialog open={open} onOpenChange={newOpen => !newOpen && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>{isEdit ? 'Edit Role' : 'Add New Role'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update role name and set resource permissions.'
              : 'Create a new role and configure its permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='flex min-w-0 flex-col gap-6'>
          <Field>
            <FieldLabel className='gap-0'>
              Role Name <RequiredMark />
            </FieldLabel>
            <Input placeholder='Enter role name' {...register('name')} />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <div>
            <p className='text-foreground mb-3 text-sm font-medium'>Role Permissions</p>
            <div className='overflow-hidden rounded-lg border'>
              <ScrollArea className='min-w-0 [&_[data-slot=table-container]]:overflow-visible'>
                <RolePermissionsTable control={control} watch={watch} />

                <ScrollBar orientation='horizontal' className='data-horizontal:h-1.5' />
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Save Role</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RolePermissionDialog
