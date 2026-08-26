// React Imports
import type { CSSProperties, ReactNode } from 'react'

// Next Imports
import type { Metadata } from 'next'
import { cookies } from 'next/headers'

// Third-party Imports
import { NuqsAdapter } from 'nuqs/adapters/next/app'

// Type Imports
import { initialSettings, type Settings } from '@/contexts/settingsContext'

// Component Imports
import Providers from '@/components/Providers'
import { TooltipProvider } from '@/components/ui/tooltip'

// Config Imports
import themeConfig from '@/configs/themeConfig'

// Util Imports
import { cn } from '@/lib/utils'
import { allFonts, FONT_CONFIG } from '@/utils/fonts'

// Style Imports
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const title = `${themeConfig.templateName} - Shadcn Logistic App Template`

const description =
  'Logistics and supply chain admin dashboard for managing orders, shipments, fleet, inventory and warehouses.'

export const metadata: Metadata = {
  // Required for the relative og-image path below to resolve to an absolute URL.
  metadataBase: new URL(appUrl),
  title,
  description,
  openGraph: {
    type: 'website',
    siteName: themeConfig.templateName,
    title,
    description,
    url: '/',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: title
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png']
  }
}

const RootLayout = async ({ children }: Readonly<{ children: ReactNode }>) => {
  const cookieStore = await cookies()
  const settingsCookie = cookieStore.get(themeConfig.settingsCookieName)

  let settingsData: Settings | undefined

  if (settingsCookie) {
    try {
      settingsData = JSON.parse(settingsCookie.value) as Settings
    } catch (error) {
      console.error('Failed to parse settings cookie:', error)
    }
  }

  const mode = settingsData?.mode ?? themeConfig.mode

  const fontVariable = FONT_CONFIG[settingsData?.font ?? initialSettings.font]?.variable ?? '--font-geist-mono'

  const sidebarOpen = settingsData?.sidebarOpen ?? themeConfig.sidebarOpen

  const defaultOpen = sidebarOpen

  return (
    <html
      lang='en'
      className={cn(...allFonts.map(f => f.variable), 'flex min-h-full w-full antialiased', mode)}
      style={{ fontFamily: `var(${fontVariable})`, '--font-sans': `var(${fontVariable})` } as CSSProperties}
      suppressHydrationWarning
    >
      <body className='flex min-h-full w-full flex-auto flex-col' suppressHydrationWarning>
        <NuqsAdapter>
          <Providers settingsCookie={settingsData} sidebarDefaultOpen={defaultOpen}>
            <TooltipProvider>{children}</TooltipProvider>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}

export default RootLayout
