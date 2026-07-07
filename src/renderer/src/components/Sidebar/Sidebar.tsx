import { useReducedMotionSafe } from '@renderer/animations'
import { useAuthStore } from '@renderer/store'
import { IconReleases, IconUsers } from '../../assets/icons'
import { ROUTE_PATHS, ROUTE_TITLES, type RoutePath } from '../../router/routePaths'
import { SidebarItem } from './SidebarItem'
import styles from './Sidebar.module.scss'
import { Logo } from '@renderer/assets/Logo'

interface NavItem {
  path: RoutePath
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
  /** When true, only shown to approved admins. */
  adminOnly?: boolean
}

// Labels come from the route table so they never drift from the title bar.
const NAV_ITEMS: NavItem[] = [
  { path: ROUTE_PATHS.ROOT, icon: Logo },
  { path: ROUTE_PATHS.RELEASES, icon: IconReleases },
  { path: ROUTE_PATHS.ACCESS, icon: IconUsers, adminOnly: true }
]

/**
 * Left navigation rail — a fixed icon-only column. Hovering an icon reveals a
 * tooltip to its right with the page name.
 */
export function Sidebar(): React.JSX.Element {
  const reduced = useReducedMotionSafe()
  const isAdmin = useAuthStore(
    (state) => state.profile?.role === 'admin' && state.profile?.status === 'approved'
  )
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            to={item.path}
            label={ROUTE_TITLES[item.path]}
            Icon={item.icon}
            reduced={reduced}
          />
        ))}
      </nav>
    </aside>
  )
}
