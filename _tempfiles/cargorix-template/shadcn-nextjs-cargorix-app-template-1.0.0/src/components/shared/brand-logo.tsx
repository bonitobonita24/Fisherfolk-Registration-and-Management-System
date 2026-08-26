// Config Imports
import themeConfig from '@/configs/themeConfig'

// Util Imports
import { cn } from '@/lib/utils'

// SVG Imports
import LogoSvg from '@/assets/svg/logo'

const BrandLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoSvg className='size-8.5' />
      <span className='text-xl font-bold'>{themeConfig.templateName}</span>
    </div>
  )
}

export default BrandLogo
