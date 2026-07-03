import type { ElectronAPI } from '@electron-toolkit/preload'
import type { RendererApi } from './ipc/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererApi
  }
}
