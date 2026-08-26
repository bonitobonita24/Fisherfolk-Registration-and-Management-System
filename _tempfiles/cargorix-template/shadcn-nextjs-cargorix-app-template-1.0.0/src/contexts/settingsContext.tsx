'use client'

// React Imports
import type { ReactNode } from 'react'
import { createContext, useEffect, useMemo, useRef } from 'react'

// Third-party Imports
import { useTheme } from 'next-themes'

// Hook Imports
import { useObjectCookie } from '@/hooks/use-object-cookie'

// Config Imports
import themeConfig from '@/configs/themeConfig'

// Util Imports
import { FONT_CONFIG, type FontKey } from '@/utils/fonts'
import type { ThemePresetKey } from '@/utils/theme-presets'
import { themePresets } from '@/utils/theme-presets'

const PRESET_CSS_VARS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'shadow-color',
  'shadow-opacity',
  'shadow-blur',
  'shadow-spread',
  'shadow-offset-x',
  'shadow-offset-y'
] as const

export type Mode = 'light' | 'dark' | 'system'
export type Collapsible = 'offcanvas' | 'icon' | 'none'
export type Variant = 'default' | 'inset' | 'floating'
export type Radius = 'none' | 'sm' | 'md' | 'lg'
export type { FontKey, ThemePresetKey }
export type Layout = 'compact' | 'full'
export type Scale = 'sm' | 'md' | 'lg'

export const RADIUS_VALUES: Record<Radius, string> = {
  none: '0rem',
  sm: '0.45rem',
  md: '0.625rem',
  lg: '0.875rem'
}

export type Settings = {
  mode: Mode
  collapsible: Collapsible
  variant: Variant
  sidebarOpen: boolean
  themePreset: ThemePresetKey
  radius: Radius
  layout: Layout
  scale: Scale
  font: FontKey
}

type BroadcastMessage = {
  type: 'SETTINGS_UPDATED'
  payload: Settings
}

type SettingsContextProps = {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
}

type Props = {
  children: ReactNode
  settingsCookie?: Settings
}

export const initialSettings: Settings = {
  mode: themeConfig.mode,
  themePreset: themeConfig.themePreset as ThemePresetKey,
  font: themeConfig.font as FontKey,
  radius: themeConfig.radius,
  scale: themeConfig.scale,
  layout: themeConfig.layout,
  variant: themeConfig.sidebarVariant,
  collapsible: themeConfig.sidebarCollapsible,
  sidebarOpen: themeConfig.sidebarOpen
}

export const SettingsContext = createContext<SettingsContextProps | null>(null)

export const SettingsProvider = (props: Props) => {
  // Props
  const { children } = props

  // Hooks
  const { setTheme, resolvedTheme } = useTheme()

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  const [cookie, updateCookie] = useObjectCookie<Settings>(themeConfig.settingsCookieName, {
    ...initialSettings,
    ...props.settingsCookie
  })

  const settings: Settings = useMemo(() => ({ ...initialSettings, ...cookie }), [cookie])

  useEffect(() => {
    if (!props.settingsCookie) {
      updateCookie(initialSettings)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        if (!broadcastChannelRef.current) {
          broadcastChannelRef.current = new BroadcastChannel(themeConfig.settingsCookieName)
        }

        const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
          const { type, payload } = event.data

          if (type === 'SETTINGS_UPDATED') {
            updateCookie(payload)
          }
        }

        broadcastChannelRef.current.onmessage = handleMessage

        return () => {
          broadcastChannelRef.current?.close()
          broadcastChannelRef.current = null
        }
      } catch (error) {
        console.error('BroadcastChannel error:', error)

        if (broadcastChannelRef.current) {
          try {
            broadcastChannelRef.current.close()
          } catch {}

          broadcastChannelRef.current = null
        }
      }
    }
  }, [updateCookie])

  const broadcastSettingsUpdate = (updatedSettings: Settings) => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return
    }

    if (!broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current = new BroadcastChannel(themeConfig.settingsCookieName)
      } catch (error) {
        console.error('Failed to create BroadcastChannel', error)

        return
      }
    }

    try {
      broadcastChannelRef.current.postMessage({
        type: 'SETTINGS_UPDATED',
        payload: updatedSettings
      })
    } catch (error) {
      console.error('Failed to broadcast settings update', error)

      try {
        broadcastChannelRef.current.close()
      } catch {}

      broadcastChannelRef.current = null
    }
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings }

    updateCookie(updatedSettings)

    if (newSettings.mode) {
      setTheme(newSettings.mode)
    }

    broadcastSettingsUpdate(updatedSettings)
  }

  useEffect(() => {
    setTheme(settings.mode)
  }, [settings.mode, setTheme])

  useEffect(() => {
    const root = document.documentElement

    if (settings.themePreset === 'default') {
      PRESET_CSS_VARS.forEach(key => root.style.removeProperty(`--${key}`))

      return
    }

    const preset = themePresets[settings.themePreset]

    if (!preset) return

    const mode = resolvedTheme === 'dark' ? 'dark' : 'light'

    Object.entries(preset.styles[mode]).forEach(([key, value]) => {
      if (value !== undefined) root.style.setProperty(`--${key}`, value as string)
    })
  }, [settings.themePreset, resolvedTheme])

  useEffect(() => {
    document.documentElement.style.setProperty('--radius', RADIUS_VALUES[settings.radius])
  }, [settings.radius])

  useEffect(() => {
    if (settings.scale === 'md') {
      document.documentElement.removeAttribute('data-theme-scale')
    } else {
      document.documentElement.setAttribute('data-theme-scale', settings.scale)
    }
  }, [settings.scale])

  useEffect(() => {
    const root = document.documentElement
    const fontVar = FONT_CONFIG[settings.font]?.variable ?? '--font-geist-sans'

    const resolved = getComputedStyle(root).getPropertyValue(fontVar).trim()

    if (resolved) {
      root.style.setProperty('font-family', resolved)
      root.style.setProperty('--font-sans', resolved)
    } else {
      root.style.setProperty('font-family', `var(${fontVar})`)
      root.style.setProperty('--font-sans', `var(${fontVar})`)
    }
  }, [settings.font])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
