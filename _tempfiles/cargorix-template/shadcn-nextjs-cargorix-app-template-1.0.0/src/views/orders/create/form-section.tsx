// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import type { PackageIcon } from 'lucide-react'

// Props
type FormSectionProps = {
  icon: typeof PackageIcon
  title: string
  children: ReactNode

  description?: string
}

const FormSection = ({ icon: Icon, title, description, children }: FormSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <div className='flex items-start gap-2.5'>
        <span className='bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <Icon className='size-4' />
        </span>
        <div className='min-w-0'>
          <h2 className='text-base font-semibold'>{title}</h2>
          {description && <p className='text-muted-foreground mt-0.5 text-sm'>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export const OptionalHint = () => <span className='text-muted-foreground font-normal'>(optional)</span>

export default FormSection
