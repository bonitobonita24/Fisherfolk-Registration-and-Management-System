'use client'

// React Imports
import { useCallback, useMemo, type ComponentType } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

// Third-party Imports
import * as Icon from 'lucide-react'
import { ChevronRightIcon, SquareArrowOutUpRightIcon } from 'lucide-react'

// Type Imports
import type { MenuGroupSubItem, MenuItem, MenuLeafSubItem, MenuSubItem } from '@/configs/navConfig'

// Component Imports
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'

// Config Imports
import { navItems } from '@/configs/navConfig'
import themeConfig from '@/configs/themeConfig'

// Hook Imports
import { useSettings } from '@/hooks/use-settings'

// Util Imports
import { cn } from '@/lib/utils'

// SVG Imports
import Logo from '@/assets/svg/logo'

type NavLink = Pick<MenuLeafSubItem, 'href' | 'activePath'>

type IsLinkActive = (link: NavLink) => boolean

const isSubGroup = (item: MenuSubItem): item is MenuGroupSubItem => 'childItems' in item

const isExternalLink = (href: string) => href.startsWith('http://') || href.startsWith('https://')

const normalizePath = (path: string) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path)

const isWithin = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`)

function getMatchScore(link: NavLink, pathname: string, searchParams: Pick<URLSearchParams, 'get'>): number {
  if (link.activePath) {
    const base = normalizePath(link.activePath)

    return isWithin(pathname, base) ? base.length : 0
  }

  if (isExternalLink(link.href)) return 0

  const [hrefPath, hrefQuery] = link.href.split('?')
  const base = normalizePath(hrefPath)

  if (hrefQuery) {
    if (pathname !== base) return 0

    for (const [key, value] of new URLSearchParams(hrefQuery).entries()) {
      if (searchParams.get(key) !== value) return 0
    }

    return base.length + hrefQuery.length + 1
  }

  return isWithin(pathname, base) ? base.length : 0
}

const collectNavLinks = (items: MenuItem[]): NavLink[] =>
  items.flatMap(item =>
    item.childItems
      ? item.childItems.flatMap(subItem => (isSubGroup(subItem) ? subItem.childItems : [subItem]))
      : [item]
  )

const SidebarGroupedMenuItems = ({
  data,
  groupLabel,
  isLinkActive
}: {
  data: MenuItem[]
  groupLabel?: string
  isLinkActive: IsLinkActive
}) => {
  return (
    <SidebarGroup>
      {groupLabel && (
        <SidebarGroupLabel className='text-sidebar-foreground/50 tracking-wider uppercase'>
          {groupLabel}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {data.map(item => {
            const Tag = item.icon ? (Icon[item.icon] as ComponentType) : null

            const isChildActive =
              item.childItems?.some(subItem =>
                isSubGroup(subItem) ? subItem.childItems.some(isLinkActive) : isLinkActive(subItem)
              ) ?? false

            return item.childItems ? (
              <Collapsible className='group/collapsible' key={item.label} defaultOpen={isChildActive}>
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={isChildActive}
                        className='data-active:bg-primary! data-active:text-primary-foreground!'
                      />
                    }
                  >
                    {Tag && <Tag />}
                    <span>{item.label}</span>
                    <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                  </CollapsibleTrigger>
                  <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                    <SidebarMenuSub>
                      {item.childItems.map(subItem =>
                        isSubGroup(subItem) ? (
                          <Collapsible
                            className='group/subcollapsible'
                            key={subItem.label}
                            defaultOpen={subItem.childItems.some(isLinkActive)}
                          >
                            <SidebarMenuSubItem>
                              <CollapsibleTrigger
                                nativeButton={false}
                                render={
                                  <SidebarMenuSubButton
                                    className='data-active:bg-primary! data-active:text-primary-foreground! justify-between'
                                    isActive={subItem.childItems.some(isLinkActive)}
                                  />
                                }
                              >
                                {subItem.label}
                                <ChevronRightIcon className='ml-auto shrink-0 transition-transform duration-200 group-data-open/subcollapsible:rotate-90' />
                              </CollapsibleTrigger>
                              <CollapsibleContent className='h-(--collapsible-panel-height) overflow-hidden transition-all duration-200 data-ending-style:h-0 data-starting-style:h-0'>
                                <SidebarMenuSub className='mx-0'>
                                  {subItem.childItems.map(leaf => (
                                    <SidebarMenuSubItem key={leaf.label}>
                                      <SidebarMenuSubButton
                                        className='data-active:bg-primary! data-active:text-primary-foreground! justify-between'
                                        render={<Link href={leaf.href} target={leaf.target} />}
                                        isActive={isLinkActive(leaf)}
                                      >
                                        {leaf.label}
                                        {isExternalLink(leaf.href) && (
                                          <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                                        )}
                                        {leaf.badge && (
                                          <SidebarMenuBadge
                                            className={cn(
                                              'bg-primary text-primary-foreground rounded-full px-1.5 font-normal',
                                              leaf.badgeClassName
                                            )}
                                          >
                                            {leaf.badge}
                                          </SidebarMenuBadge>
                                        )}
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        ) : (
                          <SidebarMenuSubItem key={subItem.label}>
                            <SidebarMenuSubButton
                              className='data-active:bg-primary! data-active:text-primary-foreground! justify-between'
                              render={<Link href={subItem.href} target={subItem.target} />}
                              isActive={isLinkActive(subItem)}
                            >
                              {subItem.label}
                              {isExternalLink(subItem.href) && (
                                <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                              )}
                              {subItem.badge && (
                                <SidebarMenuBadge
                                  className={cn(
                                    'bg-primary text-primary-foreground rounded-full px-1.5 font-normal',
                                    subItem.badgeClassName
                                  )}
                                >
                                  {subItem.badge}
                                </SidebarMenuBadge>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  tooltip={item.label}
                  render={<Link href={item.href} target={item.target} />}
                  isActive={isLinkActive(item)}
                  className='data-active:bg-primary! data-active:text-primary-foreground!'
                >
                  {Tag && <Tag />}
                  <span>{item.label}</span>
                  {isExternalLink(item.href) && (
                    <SquareArrowOutUpRightIcon className='ml-auto size-3.5! shrink-0 opacity-50' />
                  )}
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge
                    className={cn(
                      'bg-primary text-primary-foreground rounded-full px-1.5 font-normal',
                      item.badgeClassName
                    )}
                  >
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

const SidebarLayout = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { settings } = useSettings()

  const collapsibleMode = settings.sidebarOpen ? 'icon' : settings.collapsible

  const bestMatchScore = useMemo(
    () =>
      navItems
        .flatMap(navItem => collectNavLinks(navItem.items))
        .reduce((best, link) => Math.max(best, getMatchScore(link, pathname, searchParams)), 0),
    [pathname, searchParams]
  )

  const isLinkActive = useCallback<IsLinkActive>(
    link => {
      const score = getMatchScore(link, pathname, searchParams)

      return score > 0 && score === bestMatchScore
    },
    [pathname, searchParams, bestMatchScore]
  )

  return (
    <Sidebar
      collapsible={collapsibleMode}
      variant={settings.variant === 'default' ? 'sidebar' : settings.variant}
      className={cn(settings.variant === 'floating' && 'bg-muted')}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              className='gap-2.5 bg-transparent! [&>svg]:size-8'
              render={<Link href={`${themeConfig.homePageUrl}`} />}
            >
              <Logo />
              <div className='flex flex-col items-start'>
                <span className='text-lg font-semibold text-nowrap'>{themeConfig.templateName}</span>
                <span className='text-xs font-light text-nowrap'>Logistic Template</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='group-data-[collapsible=icon]:overflow-y-auto'>
        {navItems.map((navItem, index) => {
          return (
            <SidebarGroupedMenuItems
              key={navItem.groupLabel || index}
              data={navItem.items}
              groupLabel={navItem.groupLabel}
              isLinkActive={isLinkActive}
            />
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}

export default SidebarLayout
