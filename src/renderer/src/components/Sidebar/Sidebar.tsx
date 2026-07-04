import { useReducedMotionSafe } from '@renderer/animations'
import { IconHome, IconReleases } from '../../assets/icons'
import { ROUTE_PATHS, ROUTE_TITLES, type RoutePath } from '../../router/routePaths'
import { SidebarItem } from './SidebarItem'
import styles from './Sidebar.module.scss'

interface NavItem {
  path: RoutePath
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
}

// Labels come from the route table so they never drift from the title bar.
const NAV_ITEMS: NavItem[] = [
  { path: ROUTE_PATHS.ROOT, icon: IconHome },
  { path: ROUTE_PATHS.RELEASES, icon: IconReleases }
]

/**
 * Left navigation rail — a fixed icon-only column. Hovering an icon reveals a
 * tooltip to its right with the page name.
 */
export function Sidebar(): React.JSX.Element {
  const reduced = useReducedMotionSafe()

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
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
