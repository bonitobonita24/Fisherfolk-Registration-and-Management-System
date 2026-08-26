// React Imports
import type { ReactNode } from 'react'

type InfoRowProps = {
  icon: ReactNode
  label: string
  value?: ReactNode
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
  return (
    <div className='flex items-start gap-3'>
      <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg [&>svg]:size-4'>
        {icon}
      </span>
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs'>{label}</p>
        {value ? (
          <div className='truncate text-sm font-medium' title={typeof value === 'string' ? value : undefined}>
            {value}
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>—</p>
        )}
      </div>
    </div>
  )
}

export default InfoRow
