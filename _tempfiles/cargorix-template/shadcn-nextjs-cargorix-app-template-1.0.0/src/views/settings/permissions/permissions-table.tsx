'use client'

// React Imports
import type { ComponentType } from 'react'

// Third-party Imports
import { EyeIcon, PencilLineIcon, PlusIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { PermissionKey, Role } from '@/types/entities/role'
import type { User } from '@/types/entities/user'

// Component Imports
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Util Imports
import { getUserCountByRole } from '@/lib/selectors/user-selectors'
import { cn } from '@/lib/utils'

const ACTIONS: { key: PermissionKey; Icon: ComponentType<{ className?: string }>; label: string }[] = [
  { key: 'read', Icon: EyeIcon, label: 'Read' },
  { key: 'write', Icon: PencilLineIcon, label: 'Write' },
  { key: 'create', Icon: PlusIcon, label: 'Create' },
  { key: 'delete', Icon: Trash2Icon, label: 'Delete' }
]

type PermissionChipProps = {
  Icon: ComponentType<{ className?: string }>
  label: string
  allowed: boolean
  onChange: (value: boolean) => void
}

const PermissionChip = ({ Icon, label, allowed, onChange }: PermissionChipProps) => {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          type='button'
          onClick={() => onChange(!allowed)}
          aria-label={`Toggle ${label}`}
          variant={allowed ? 'default' : 'outline'}
          size='icon-sm'
          className={cn(
            'text-muted-foreground hover:text-foreground',
            allowed && 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <Icon className='size-3' />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

type PermissionsTableProps = {
  roles: Role[]
  users: User[]
  resources: string[]
  onPermissionChange: (roleId: string, resource: string, action: PermissionKey, value: boolean) => void
}

const PermissionsTable = ({ roles, users, resources, onPermissionChange }: PermissionsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='p-4 font-semibold'>Resource</TableHead>
          {roles.map(role => {
            const userCount = getUserCountByRole(users, role.id)

            return (
              <TableHead key={role.id} className='p-4'>
                <span className='block font-semibold'>{role.name}</span>
                <span className='text-muted-foreground block text-xs font-normal'>
                  {userCount} {userCount === 1 ? 'user' : 'users'}
                </span>
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map(resource => (
          <TableRow key={resource}>
            <TableCell className='p-4 font-medium'>{resource}</TableCell>
            {roles.map(role => {
              const permission = role.permissions.find(p => p.resource === resource)

              return (
                <TableCell key={role.id} className='px-4'>
                  <div className='flex gap-1'>
                    {ACTIONS.map(({ key, Icon, label }) => (
                      <PermissionChip
                        key={key}
                        Icon={Icon}
                        label={label}
                        allowed={permission?.[key] ?? false}
                        onChange={value => onPermissionChange(role.id, resource, key, value)}
                      />
                    ))}
                  </div>
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default PermissionsTable
