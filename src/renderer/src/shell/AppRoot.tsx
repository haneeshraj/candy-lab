import { AppRouter } from '@renderer/router'
import { useAppBootstrap } from './useAppBootstrap'
import { useThemeSync } from './useThemeSync'

/**
 * Top-level composition. Runs app-wide setup (bootstrap + theme sync) once,
 * above the router, then renders the routes. Feature UI goes inside routes/
 * pages — this stays thin.
 */
export function AppRoot(): React.JSX.Element {
  useAppBootstrap()
  useThemeSync()

  return <AppRouter />
}
