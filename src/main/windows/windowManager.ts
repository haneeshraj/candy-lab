import type { BrowserWindow } from 'electron'

// Tracks live windows by name so any part of the main process can find them
// without passing references around. Windows auto-deregister when closed.

class WindowManager {
  private readonly windows = new Map<string, BrowserWindow>()

  register(name: string, window: BrowserWindow): void {
    this.windows.set(name, window)
    window.on('closed', () => this.windows.delete(name))
  }

  get(name: string): BrowserWindow | undefined {
    return this.windows.get(name)
  }

  all(): BrowserWindow[] {
    return [...this.windows.values()]
  }

  has(name: string): boolean {
    return this.windows.has(name)
  }
}

/** Singleton — one registry for the whole app. */
export const windowManager = new WindowManager()
