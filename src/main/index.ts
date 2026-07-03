import { bootstrap } from './app/lifecycle'

// Entry point. All lifecycle, window, security, and IPC wiring is delegated to
// the modules under ./app, ./windows, ./ipc, and ./services.
bootstrap()
