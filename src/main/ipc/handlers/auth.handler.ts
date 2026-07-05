import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import {
  getAuthState,
  listUsers,
  setRole,
  setStatus,
  signInWithGoogle,
  signOut,
  updateUser
} from '../../services/auth.service'
import type { AccessStatus, UserRole } from '../../../preload/ipc/types'

// Thin channel → service wiring for auth + access. Admin authorization is
// enforced inside `auth.service` (the service-role key never leaves main).

export function registerAuthHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.AUTH_SIGN_IN_GOOGLE, () => signInWithGoogle())
  ipcMain.handle(IPC_CHANNELS.AUTH_SIGN_OUT, () => signOut())
  ipcMain.handle(IPC_CHANNELS.AUTH_GET_STATE, () => getAuthState())

  ipcMain.handle(IPC_CHANNELS.ACCESS_LIST_USERS, () => listUsers())
  ipcMain.handle(IPC_CHANNELS.ACCESS_SET_STATUS, (_event, id: string, status: AccessStatus) =>
    setStatus(id, status)
  )
  ipcMain.handle(IPC_CHANNELS.ACCESS_SET_ROLE, (_event, id: string, role: UserRole) =>
    setRole(id, role)
  )
  ipcMain.handle(
    IPC_CHANNELS.ACCESS_UPDATE_USER,
    (_event, id: string, changes: { name?: string; notes?: string }) => updateUser(id, changes)
  )
}
