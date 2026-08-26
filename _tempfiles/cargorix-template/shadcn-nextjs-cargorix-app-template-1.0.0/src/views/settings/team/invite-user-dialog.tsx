'use client'

// React Imports
import { useEffect, useMemo } from 'react'

// Third-party Imports
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { ChevronDownIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { Role } from '@/types/entities/role'
import type { User } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Store Imports
import { useUsersStore } from '@/store/use-users-store'

// Util Imports
import { getInitials } from '@/lib/get-initials'

// Data Imports
import type { InviteUserFormInput, InviteUserFormValues } from './invite-user-schema'
import { inviteUserSchema } from './invite-user-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

const inviteResolver = zodResolver as unknown as (
  schema: typeof inviteUserSchema
) => Resolver<InviteUserFormInput, unknown, InviteUserFormValues>

const ALL_WAREHOUSES_LABEL = 'All warehouses'

const EMPTY_VALUES: InviteUserFormInput = {
  name: '',
  email: '',
  jobTitle: '',
  roleId: '',
  warehouseIds: []
}

type InviteUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: Role[]
  warehouses: Warehouse[]
  editingUser?: User | null
}

const InviteUserDialog = ({ open, onOpenChange, roles, warehouses, editingUser }: InviteUserDialogProps) => {
  // Vars
  const isEdit = Boolean(editingUser)

  // Hooks
  const users = useUsersStore(state => state.users)
  const inviteUser = useUsersStore(state => state.inviteUser)
  const updateUser = useUsersStore(state => state.updateUser)

  const { control, handleSubmit, reset, setError } = useForm<InviteUserFormInput, unknown, InviteUserFormValues>({
    resolver: inviteResolver(inviteUserSchema),
    defaultValues: EMPTY_VALUES
  })

  const roleOptions = useMemo(() => roles.map(role => ({ label: role.name, value: role.id })), [roles])

  const getWarehouseSummary = (warehouseIds: string[]) => {
    if (warehouseIds.length === 0) return ALL_WAREHOUSES_LABEL

    const names = warehouses.filter(warehouse => warehouseIds.includes(warehouse.id)).map(warehouse => warehouse.name)

    return names.length > 0 ? names.join(', ') : ALL_WAREHOUSES_LABEL
  }

  const onSubmit = (values: InviteUserFormValues) => {
    const email = values.email.trim().toLowerCase()
    const isDuplicate = users.some(user => user.email === email && user.id !== editingUser?.id)

    if (isDuplicate) {
      setError('email', { message: 'A user with this email already exists' })

      return
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: values.name.trim(),
        initials: getInitials(values.name),
        email,
        jobTitle: values.jobTitle.trim(),
        roleId: values.roleId,
        warehouseIds: values.warehouseIds
      })
      toast.success(`${values.name.trim()} updated`)
    } else {
      inviteUser({ ...values, email })
      toast.success(`Invitation sent to ${email}`)
    }

    reset(EMPTY_VALUES)
    onOpenChange(false)
  }

  const handleCancel = () => {
    reset(EMPTY_VALUES)
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) return

    reset(
      editingUser
        ? {
            name: editingUser.name,
            email: editingUser.email,
            jobTitle: editingUser.jobTitle,
            roleId: editingUser.roleId,
            warehouseIds: editingUser.warehouseIds
          }
        : EMPTY_VALUES
    )
  }, [open, editingUser, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>{isEdit ? 'Edit user' : 'Invite user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this user’s details, role, and warehouse access.'
              : 'Send an invitation and set the role and warehouse access this user gets on joining.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <Controller
            name='name'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='invite-user-name'>
                  Full name <RequiredMark />
                </FieldLabel>
                <Input
                  id='invite-user-name'
                  placeholder='e.g., Nicole Barrett'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='email'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='invite-user-email'>
                  Email <RequiredMark />
                </FieldLabel>
                <Input
                  id='invite-user-email'
                  type='email'
                  placeholder='e.g., nicole.barrett@cargorix.com'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='jobTitle'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='invite-user-job-title'>
                  Job title <RequiredMark />
                </FieldLabel>
                <Input
                  id='invite-user-job-title'
                  placeholder='e.g., Warehouse Supervisor'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='roleId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='invite-user-role'>
                  Role <RequiredMark />
                </FieldLabel>
                <Select items={roleOptions} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger
                    id='invite-user-role'
                    className='w-full'
                    aria-label='Role'
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {roleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='warehouseIds'
            control={control}
            render={({ field }) => {
              const selected = field.value ?? []

              const toggleWarehouse = (id: string, checked: boolean) =>
                field.onChange(checked ? [...selected, id] : selected.filter(current => current !== id))

              return (
                <Field>
                  <FieldLabel htmlFor='invite-user-warehouse'>Warehouse access</FieldLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          id='invite-user-warehouse'
                          variant='outline'
                          className='w-full justify-between font-normal'
                          aria-label='Warehouse access'
                        />
                      }
                    >
                      <span className='truncate'>{getWarehouseSummary(selected)}</span>
                      <ChevronDownIcon className='text-muted-foreground size-4 shrink-0' />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start'>
                      <DropdownMenuGroup>
                        <DropdownMenuCheckboxItem
                          checked={selected.length === 0}
                          onCheckedChange={checked => checked && field.onChange([])}
                          closeOnClick={false}
                        >
                          {ALL_WAREHOUSES_LABEL}
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {warehouses.map(warehouse => (
                          <DropdownMenuCheckboxItem
                            key={warehouse.id}
                            checked={selected.includes(warehouse.id)}
                            onCheckedChange={checked => toggleWarehouse(warehouse.id, checked)}
                            closeOnClick={false}
                          >
                            {warehouse.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FieldDescription>
                    {selected.length === 0
                      ? 'This user can see every warehouse and region.'
                      : `Scoped to ${selected.length} warehouse${selected.length === 1 ? '' : 's'}.`}
                  </FieldDescription>
                </Field>
              )
            }}
          />

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button type='submit'>{isEdit ? 'Save changes' : 'Send invitation'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default InviteUserDialog
