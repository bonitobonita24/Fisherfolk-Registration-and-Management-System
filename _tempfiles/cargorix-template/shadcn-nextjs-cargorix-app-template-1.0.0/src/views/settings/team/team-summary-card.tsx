'use client'

// Third-party Imports
import { HouseIcon, LockIcon, MailIcon, UserIcon, UsersRoundIcon } from 'lucide-react'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { useUsersStore } from '@/store/use-users-store'

// Util Imports
import { getUserSummary } from '@/lib/selectors/user-selectors'

const TeamSummaryCard = () => {
  // Hooks
  const users = useUsersStore(state => state.users)

  // Vars
  const summary = getUserSummary(users)

  return (
    <>
      <Card>
        <CardContent className='flex items-start gap-3'>
          <span className='bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-lg'>
            <HouseIcon className='size-5' />
          </span>
          <div className='min-w-0'>
            <h2 className='text-base font-medium'>Warehouse-based access</h2>
            <p className='text-muted-foreground text-sm'>
              User access is scoped to assigned warehouses and regions to ensure operational security and data
              visibility control.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          label='Total Users'
          value={summary.total}
          icon={<UsersRoundIcon />}
          iconClassName='bg-accent text-accent-foreground'
        />
        <StatCard
          label='Pending Invites'
          value={summary.invited}
          icon={<MailIcon />}
          iconClassName='bg-info-soft text-info'
        />
        <StatCard
          label='Active Users'
          value={summary.active}
          icon={<UserIcon />}
          iconClassName='bg-success-soft text-success'
        />
        <StatCard
          label='Suspended Users'
          value={summary.suspended}
          icon={<LockIcon />}
          iconClassName='bg-warning-soft text-warning'
        />
      </div>
    </>
  )
}

export default TeamSummaryCard
