import { IPC_CHANNELS } from '../../main/ipc/channels'
import { invoke } from '../ipc/invoke'
import { sanitizeExternalUrl, sanitizeKey } from '../utils/sanitize'
import type { SystemApi } from '../ipc/types'

/** OS integrations + settings persistence. Inputs are sanitized before send. */
export const systemBridge: SystemApi = {
  openExternal: (url) => invoke<void>(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, sanitizeExternalUrl(url)),
  getSetting: (key) => invoke(IPC_CHANNELS.SETTINGS_GET, sanitizeKey(key)),
  setSetting: (key, value) => invoke<void>(IPC_CHANNELS.SETTINGS_SET, sanitizeKey(key), value)
}
