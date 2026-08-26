// Next Imports
import Link from 'next/link'

// Component Imports
import { Button } from '@/components/ui/button'

// Util Imports
import { cn } from '@/lib/utils'

type PageBreadcrumbProps = {
  parentLabel: string
  parentHref: string
  current: string
  className?: string
}

const PageBreadcrumb = ({ parentLabel, parentHref, current, className }: PageBreadcrumbProps) => {
  return (
    <nav aria-label='Breadcrumb' className={cn('text-muted-foreground flex items-center gap-1 text-sm', className)}>
      <Button
        variant='link'
        size='sm'
        className='text-muted-foreground hover:text-foreground h-auto p-0'
        render={<Link href={parentHref} />}
        nativeButton={false}
      >
        {parentLabel}
      </Button>
      <span aria-hidden='true'>/</span>
      <span className='text-foreground truncate font-medium'>{current}</span>
    </nav>
  )
}

export default PageBreadcrumb
