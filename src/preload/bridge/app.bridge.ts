import { IPC_CHANNELS } from '../../main/ipc/channels'
import { invoke } from '../ipc/invoke'
import type { AppApi, Platform } from '../ipc/types'

/** App-info API — versions and platform. */
export const appBridge: AppApi = {
  getVersion: () => invoke<string>(IPC_CHANNELS.APP_GET_VERSION),
  getPlatform: () => invoke<Platform>(IPC_CHANNELS.APP_GET_PLATFORM)
}
