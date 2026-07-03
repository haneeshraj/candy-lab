import { app } from 'electron'
import { join } from 'path'

// Centralized, lazily-resolved filesystem paths. These read `app.getPath`, so
// only call them after the app is ready.

export const paths = {
  userData: (): string => app.getPath('userData'),
  logs: (): string => app.getPath('logs'),
  temp: (): string => app.getPath('temp'),
  settingsFile: (): string => join(app.getPath('userData'), 'settings.json')
}
