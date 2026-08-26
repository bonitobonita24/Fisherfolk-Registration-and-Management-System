// Third-party Imports
import type * as Icon from 'lucide-react'

type IconName = keyof typeof Icon

export type MenuLeafSubItem = {
  label: string
  href: string
  activePath?: string
  badge?: string
  badgeClassName?: string
  target?: '_blank' | '_self' | '_parent' | '_top'
}

export type MenuGroupSubItem = {
  label: string
  childItems: MenuLeafSubItem[]
}

export type MenuSubItem = MenuLeafSubItem | MenuGroupSubItem

export type MenuItem = {
  icon: IconName
  label: string
} & (
  | {
      href: string
      activePath?: string
      badge?: string
      badgeClassName?: string
      childItems?: never
      target?: '_blank' | '_self' | '_parent' | '_top'
    }
  | { href?: never; badge?: never; childItems: MenuSubItem[] }
)

export type NavItem = {
  groupLabel?: string
  items: MenuItem[]
}

export const navItems: NavItem[] = [
  {
    groupLabel: 'Overview',
    items: [
      {
        icon: 'Map',
        label: 'Live Map',
        href: '/live-map'
      },
      {
        icon: 'LayoutDashboard',
        label: 'Operations Overview',
        href: '/operations-overview'
      },
      {
        icon: 'PackageSearch',
        label: 'Inventory Overview',
        href: '/inventory-overview'
      }
    ]
  },
  {
    groupLabel: 'Orders',
    items: [
      {
        icon: 'ShoppingCart',
        label: 'Orders',
        href: '/orders'
      },
      {
        icon: 'Truck',
        label: 'Shipments',
        href: '/shipments'
      }
    ]
  },
  {
    groupLabel: 'Fleet',
    items: [
      { icon: 'Car', label: 'Fleet', href: '/fleet' },
      { icon: 'IdCard', label: 'Drivers', href: '/drivers' }
    ]
  },
  {
    groupLabel: 'Planner',
    items: [{ icon: 'Route', label: 'Route Planner', href: '/route-planner' }]
  },
  {
    groupLabel: 'Inventory',
    items: [
      {
        icon: 'Package',
        label: 'Products',
        href: '/products'
      },
      {
        icon: 'ScrollText',
        label: 'Stock Ledger',
        href: '/stock-ledger'
      },
      {
        icon: 'FileText',
        label: 'Purchase Orders',
        href: '/purchase-orders'
      },
      {
        icon: 'ArrowLeftRight',
        label: 'Stock Transfer',
        href: '/stock-transfers'
      },
      {
        icon: 'SlidersHorizontal',
        label: 'Stock Adjustment',
        href: '/stock-adjustments'
      }
    ]
  },
  {
    groupLabel: 'Warehouses',
    items: [
      {
        icon: 'Warehouse',
        label: 'Warehouses',
        href: '/warehouses'
      }
    ]
  },
  {
    groupLabel: 'Partners',
    items: [
      {
        icon: 'Users',
        label: 'Clients',
        href: '/clients'
      },
      {
        icon: 'Factory',
        label: 'Suppliers',
        href: '/suppliers'
      }
    ]
  },
  {
    groupLabel: 'Reports',
    items: [
      {
        icon: 'ChartColumn',
        label: 'Reports',
        href: '/reports'
      }
    ]
  },
  {
    groupLabel: 'Settings',
    items: [
      {
        icon: 'Settings',
        label: 'General',
        href: '/settings/general'
      },
      {
        icon: 'UsersRound',
        label: 'Team & Users',
        href: '/settings/team'
      },
      {
        icon: 'ShieldCheckIcon',
        label: 'Roles & Permissions',
        childItems: [
          { label: 'Roles', href: '/settings/roles' },
          { label: 'Permissions', href: '/settings/permissions' }
        ]
      },
      {
        icon: 'Bell',
        label: 'Notifications',
        href: '/settings/notifications'
      },
      {
        icon: 'History',
        label: 'Activity Log',
        href: '/settings/activity'
      }
    ]
  }
]
