import { HashRouter } from 'react-router-dom'
import { AppRouter } from '@renderer/router'
import { TitleBar } from '../components/TitleBar'
import { Sidebar } from '../components/Sidebar'
import { useAppBootstrap } from './useAppBootstrap'
import { useThemeSync } from './useThemeSync'
import { useUpdaterSync } from './useUpdaterSync'

/**
 * Top-level composition. Runs app-wide setup (bootstrap + theme sync) once, and
 * provides the HashRouter so the whole shell — title bar included — is inside
 * routing context (the title bar reads the current route). HashRouter is used
 * for Electron: works over `file://`, no server, survives production reloads.
 */
export function AppRoot(): React.JSX.Element {
  useAppBootstrap()
  useThemeSync()
  useUpdaterSync()

  return (
    <HashRouter>
      <div className="app-shell">
        <TitleBar />
        <div className="app-main">
          <Sidebar />
          <div className="app-body">
            <AppRouter />
          </div>
        </div>
      </div>
    </HashRouter>
  )
}
