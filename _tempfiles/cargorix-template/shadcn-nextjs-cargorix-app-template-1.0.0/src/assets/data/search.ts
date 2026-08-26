// React Imports
import type { ComponentType } from 'react'

// Third-party Imports
import * as Icon from 'lucide-react'
import type { LucideProps } from 'lucide-react'

// Type Imports
import type { MenuGroupSubItem, MenuItem, MenuSubItem } from '@/configs/navConfig'

// Config Imports
import { navItems } from '@/configs/navConfig'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useProductsStore } from '@/store/use-products-store'
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useRoutesStore } from '@/store/use-routes-store'

export type SearchItem = {
  icon: ComponentType<LucideProps>
  name: string
  href: string
  shortcut?: string
  openInNewTab?: boolean
  tags?: string[]
  run?: () => string
}

export type SearchData = {
  title: string
  data: SearchItem[]
}

export const QUICK_ACTIONS_TITLE = 'Quick actions'

const draftHref = (section: string, createDraft?: (id: string) => void): string => {
  const id = crypto.randomUUID()

  createDraft?.(id)

  return `${section}/create/${id}`
}

const quickActions: SearchItem[] = [
  {
    icon: Icon.ShoppingCart,
    name: 'Create order',
    href: '/orders',
    tags: ['new', 'add', 'order'],
    run: () => draftHref('/orders', useOrdersStore.getState().createDraftOrder)
  },
  {
    icon: Icon.Package,
    name: 'Create product',
    href: '/products',
    tags: ['new', 'add', 'product', 'catalogue'],
    run: () => draftHref('/products', useProductsStore.getState().createDraftProduct)
  },
  {
    icon: Icon.Warehouse,
    name: 'Create warehouse',
    href: '/warehouses',
    tags: ['new', 'add', 'warehouse', 'site'],
    run: () => draftHref('/warehouses')
  },
  {
    icon: Icon.FileText,
    name: 'Create purchase order',
    href: '/purchase-orders',
    tags: ['new', 'add', 'po', 'purchase order', 'procurement'],
    run: () => draftHref('/purchase-orders', usePurchaseOrdersStore.getState().createDraftPurchaseOrder)
  },
  {
    icon: Icon.Route,
    name: 'Create route',
    href: '/route-planner',
    tags: ['new', 'add', 'route', 'route planner', 'dispatch'],
    run: () => draftHref('/route-planner', useRoutesStore.getState().createDraftRoute)
  }
]

const isGroup = (item: MenuSubItem): item is MenuGroupSubItem => 'childItems' in item

const toItems = (item: MenuItem, groupLabel: string): SearchItem[] => {
  const icon = Icon[item.icon] as ComponentType<LucideProps>

  const toItem = (name: string, href: string, tags: string[], target?: string): SearchItem => ({
    icon,
    name,
    href,
    tags,
    ...(target === '_blank' ? { openInNewTab: true } : {})
  })

  if (!item.childItems) return [toItem(item.label, item.href, [groupLabel], item.target)]

  const flatten = (subItems: MenuSubItem[], trail: string[]): SearchItem[] =>
    subItems.flatMap(subItem =>
      isGroup(subItem)
        ? flatten(subItem.childItems, [...trail, subItem.label])
        : [toItem(subItem.label, subItem.href, trail, subItem.target)]
    )

  return flatten(item.childItems, [groupLabel, item.label])
}

export const searchData: SearchData[] = [
  { title: QUICK_ACTIONS_TITLE, data: quickActions },
  ...navItems.map(({ groupLabel, items }) => {
    const title = groupLabel ?? 'General'

    return { title, data: items.flatMap(item => toItems(item, title)) }
  })
]
