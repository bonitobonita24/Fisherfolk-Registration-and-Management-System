'use client'

// Third-party Imports
import type { Control, UseFormWatch } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'

// Type Imports
import type { PermissionKey } from '@/types/entities/role'
import { PERMISSION_KEY_LIST } from '@/types/entities/role'

// Component Imports
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Data Imports
import type { RoleFormInput } from './role-form-schema'

type RolePermissionsTableProps = {
  control: Control<RoleFormInput>
  watch: UseFormWatch<RoleFormInput>
}

const RolePermissionsTable = ({ control, watch }: RolePermissionsTableProps) => {
  // Hooks
  const { fields, update, replace } = useFieldArray({ control, name: 'permissions' })

  // Vars
  const currentPermissions = watch('permissions') ?? []

  const allGlobalSelected =
    currentPermissions.length > 0 && currentPermissions.every(p => PERMISSION_KEY_LIST.every(a => p[a]))

  const someGlobalSelected = currentPermissions.some(p => PERMISSION_KEY_LIST.some(a => p[a])) && !allGlobalSelected

  const handleGlobalSelectAll = (checked: boolean) => {
    replace(currentPermissions.map(p => ({ ...p, read: checked, write: checked, create: checked, delete: checked })))
  }

  const handleRowSelectAll = (index: number, checked: boolean) => {
    const permission = currentPermissions[index]

    if (!permission) return
    update(index, { ...permission, read: checked, write: checked, create: checked, delete: checked })
  }

  const handlePermissionChange = (index: number, action: PermissionKey, checked: boolean) => {
    const permission = currentPermissions[index]

    if (!permission) return
    update(index, { ...permission, [action]: checked })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='w-48 p-3'>Resource</TableHead>
          <TableHead className='p-3! text-center'>
            <div className='flex flex-col items-center gap-1'>
              <Checkbox
                checked={allGlobalSelected}
                indeterminate={someGlobalSelected}
                onCheckedChange={value => handleGlobalSelectAll(!!value)}
                aria-label='Select all permissions'
              />
            </div>
          </TableHead>
          {PERMISSION_KEY_LIST.map(action => (
            <TableHead key={action} className='p-3 text-center capitalize'>
              {action}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field, index) => {
          const permission = currentPermissions[index]

          if (!permission) return null

          const allForRow = PERMISSION_KEY_LIST.every(a => permission[a])
          const someForRow = PERMISSION_KEY_LIST.some(a => permission[a]) && !allForRow

          return (
            <TableRow key={field.id}>
              <TableCell className='p-3 font-medium'>{permission.resource}</TableCell>
              <TableCell className='p-3! text-center'>
                <Checkbox
                  className='inline-flex'
                  checked={allForRow}
                  indeterminate={someForRow}
                  onCheckedChange={value => handleRowSelectAll(index, !!value)}
                  aria-label={`Select all for ${permission.resource}`}
                />
              </TableCell>
              {PERMISSION_KEY_LIST.map(action => (
                <TableCell key={action} className='p-3 text-center'>
                  <Checkbox
                    className='inline-flex'
                    checked={permission[action]}
                    onCheckedChange={value => handlePermissionChange(index, action, !!value)}
                    aria-label={`${permission.resource} ${action}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default RolePermissionsTable
