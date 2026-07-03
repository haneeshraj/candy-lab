import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import { systemService } from '../../services/system.service'
import { settingsService } from '../../services/settings.service'

// System + settings handlers. All heavy lifting (validation, filesystem) lives
// in the services; these stay one line each.

export function registerSystemHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, (_event, url: string) =>
    systemService.openExternal(url)
  )

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: string) => settingsService.get(key))

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, key: string, value: unknown) =>
    settingsService.set(key, value)
  )
}
