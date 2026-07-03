import { useLocation } from 'react-router-dom'
import { ROUTE_TITLES, type RoutePath } from '../../router/routePaths'
import { MenuBar } from './MenuBar'
import { WindowControls } from './WindowControls'
import styles from './TitleBar.module.scss'

// macOS draws its own traffic-light controls with `titleBarStyle: 'hidden'`,
// so we only render our own window controls on Windows/Linux.
const isMac = window.electron.process.platform === 'darwin'

/**
 * Custom title bar: menu (left) · draggable region + centered page title ·
 * window controls (right). Each piece is its own subcomponent in this folder.
 */
export function TitleBar(): React.JSX.Element {
  const { pathname } = useLocation()
  const title = ROUTE_TITLES[pathname as RoutePath] ?? ''

  return (
    <header className={styles.titlebar}>
      <MenuBar />

      {/* Draggable region; double-click toggles maximize (native behavior). */}
      <div className={styles.drag} onDoubleClick={window.api.window.maximize} />

      <span className={styles.title}>{title}</span>

      {!isMac && <WindowControls />}
    </header>
  )
}
