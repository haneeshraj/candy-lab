import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import {
  createArtist,
  createRelease,
  deleteRelease,
  listArtists,
  listReleases,
  updateRelease,
  uploadAsset
} from '../../services/release.service'
import type { ReleaseInput, UploadAssetInput } from '../../../preload/ipc/types'

// Thin channel → service wiring for the Releases CMS. All logic (Supabase
// access, mapping, validation) lives in `release.service`.

export function registerReleaseHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.RELEASES_LIST, () => listReleases())
  ipcMain.handle(IPC_CHANNELS.RELEASES_CREATE, (_event, input: ReleaseInput) =>
    createRelease(input)
  )
  ipcMain.handle(IPC_CHANNELS.RELEASES_UPDATE, (_event, id: string, input: ReleaseInput) =>
    updateRelease(id, input)
  )
  ipcMain.handle(IPC_CHANNELS.RELEASES_DELETE, (_event, id: string) => deleteRelease(id))
  ipcMain.handle(IPC_CHANNELS.RELEASES_LIST_ARTISTS, () => listArtists())
  ipcMain.handle(IPC_CHANNELS.RELEASES_CREATE_ARTIST, (_event, name: string) => createArtist(name))
  ipcMain.handle(IPC_CHANNELS.RELEASES_UPLOAD_ASSET, (_event, input: UploadAssetInput) =>
    uploadAsset(input)
  )
}
