// Third-party Imports
import { CircleCheckBigIcon, CrosshairIcon, TruckIcon } from 'lucide-react'

const STEPS = [
  {
    icon: CircleCheckBigIcon,
    title: 'Review & confirm',
    description: 'Review the details and confirm the order.'
  },
  {
    icon: TruckIcon,
    title: 'Assign & dispatch',
    description: 'Assign a driver and vehicle to dispatch.'
  },
  {
    icon: CrosshairIcon,
    title: 'Track & update',
    description: 'Track progress and update status.'
  }
]

const NextStepsList = () => {
  return (
    <div className='space-y-4'>
      <h2 className='font-semibold'>What happens next?</h2>
      <ol className='space-y-1'>
        {STEPS.map((step, index) => (
          <li key={step.title} className='flex gap-3'>
            <div className='flex flex-col items-center'>
              <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-full'>
                <step.icon className='size-4' />
              </span>
              {index < STEPS.length - 1 && <span className='border-border my-1 w-px flex-1 border-l border-dashed' />}
            </div>
            <div className={index < STEPS.length - 1 ? 'pb-4' : ''}>
              <p className='text-sm font-medium'>{step.title}</p>
              <p className='text-muted-foreground text-xs'>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default NextStepsList
