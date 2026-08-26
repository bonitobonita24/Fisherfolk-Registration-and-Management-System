'use client'

// Component Imports
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import ModeToggle from '@/components/layout/ModeToggle'
import CommandMenu from './CommandMenu'
import ThemeCustomizer from './ThemeCustomizer'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'

// Util Imports
import { cn } from '@/lib/utils'

const Header = () => {
  const { settings, updateSettings } = useSettings()
  const { open, isMobile } = useSidebar()

  return (
    <header className='sticky top-0 z-50 px-4 before:absolute before:inset-0 before:rounded-t-xl before:mask-[linear-gradient(var(--card),var(--card)_18%,transparent_100%)] before:backdrop-blur-md sm:px-6'>
      <div
        className={cn(
          'bg-card relative z-51 mx-auto mt-3 flex w-full items-center justify-between rounded-xl border px-6 py-2',
          settings.layout === 'compact' ? 'max-w-348' : 'w-full',
          settings.variant === 'floating' ? 'shadow-xs' : ''
        )}
      >
        <div className='flex items-center gap-2'>
          <SidebarTrigger
            className='[&_svg]:size-5!'
            onClick={() => {
              if (!isMobile) updateSettings({ sidebarOpen: !open })
            }}
          />
          <CommandMenu />
        </div>
        <div className='flex items-center gap-2'>
          <ThemeCustomizer />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
