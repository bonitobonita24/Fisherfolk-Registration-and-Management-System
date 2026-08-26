// Component Imports
import { Badge } from '@/components/ui/badge'

const OperationsOverviewHeader = () => (
  <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
    <div>
      <div className='flex flex-wrap items-center gap-3'>
        <h1 className='text-2xl font-semibold tracking-tight'>Operations Overview</h1>
        <Badge variant='outline' className='text-success gap-1.5 rounded-full'>
          <span className='bg-success size-1.5 rounded-full' />
          Live operations
        </Badge>
      </div>
      <p className='text-muted-foreground mt-1.5 text-sm'>
        Track order flow, active shipments, and fleet readiness across the network.
      </p>
    </div>
  </div>
)

export default OperationsOverviewHeader
