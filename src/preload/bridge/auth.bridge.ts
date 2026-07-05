import { IPC_CHANNELS } from '../../main/ipc/channels'
import { invoke } from '../ipc/invoke'
import { on } from '../ipc/on'
import type { AccessApi, AuthApi, AuthState, Profile } from '../ipc/types'

/** Auth API — Google sign-in, sign-out, and live auth-state updates. */
export const authBridge: AuthApi = {
  signInWithGoogle: () => invoke<AuthState>(IPC_CHANNELS.AUTH_SIGN_IN_GOOGLE),
  signOut: () => invoke<void>(IPC_CHANNELS.AUTH_SIGN_OUT),
  getState: () => invoke<AuthState>(IPC_CHANNELS.AUTH_GET_STATE),
  onStateChange: (callback) =>
    on(IPC_CHANNELS.AUTH_STATE_CHANGED, (payload) => callback(payload as AuthState))
}

/** Access API — admin-only user management (guarded in main). */
export const accessBridge: AccessApi = {
  listUsers: () => invoke<Profile[]>(IPC_CHANNELS.ACCESS_LIST_USERS),
  setStatus: (id, status) => invoke<Profile>(IPC_CHANNELS.ACCESS_SET_STATUS, id, status),
  setRole: (id, role) => invoke<Profile>(IPC_CHANNELS.ACCESS_SET_ROLE, id, role),
  updateUser: (id, changes) => invoke<Profile>(IPC_CHANNELS.ACCESS_UPDATE_USER, id, changes)
}
