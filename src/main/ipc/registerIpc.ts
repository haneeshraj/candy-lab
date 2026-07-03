import { registerAppHandlers, registerWindowHandlers, registerSystemHandlers } from './handlers'
import { logger } from '../utils/logger'

/**
 * Register every IPC handler. Called once, on app ready. Add new handler
 * groups here so there is a single, obvious place all IPC is wired up.
 */
export function registerIpc(): void {
  registerAppHandlers()
  registerWindowHandlers()
  registerSystemHandlers()
  logger.info('IPC handlers registered')
}
