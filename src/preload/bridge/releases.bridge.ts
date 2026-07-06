import { IPC_CHANNELS } from '../../main/ipc/channels'
import { invoke } from '../ipc/invoke'
import type {
  Artist,
  Release,
  ReleaseInput,
  ReleasePage,
  ReleasesApi,
  UploadAssetInput
} from '../ipc/types'

/** Releases CMS API — CRUD + media uploads, all through the main process. */
export const releasesBridge: ReleasesApi = {
  list: (offset?: number, limit?: number) =>
    invoke<ReleasePage>(IPC_CHANNELS.RELEASES_LIST, offset, limit),
  create: (input: ReleaseInput) => invoke<Release>(IPC_CHANNELS.RELEASES_CREATE, input),
  update: (id: string, input: ReleaseInput) =>
    invoke<Release>(IPC_CHANNELS.RELEASES_UPDATE, id, input),
  remove: (id: string) => invoke<void>(IPC_CHANNELS.RELEASES_DELETE, id),
  tracks: (albumId: string) => invoke<Release[]>(IPC_CHANNELS.RELEASES_LIST_TRACKS, albumId),
  listArtists: () => invoke<Artist[]>(IPC_CHANNELS.RELEASES_LIST_ARTISTS),
  createArtist: (name: string) => invoke<Artist>(IPC_CHANNELS.RELEASES_CREATE_ARTIST, name),
  uploadAsset: (input: UploadAssetInput) =>
    invoke<string>(IPC_CHANNELS.RELEASES_UPLOAD_ASSET, input)
}
