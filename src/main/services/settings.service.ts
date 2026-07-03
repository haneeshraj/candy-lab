import { paths } from '../utils/paths'
import { fileService } from './file.service'

// Persists user settings to a JSON file in userData. Keeps IPC handlers thin —
// they just call these methods.

type Settings = Record<string, unknown>

async function getAll(): Promise<Settings> {
  return fileService.readJson<Settings>(paths.settingsFile(), {})
}

async function get(key: string): Promise<unknown> {
  const settings = await getAll()
  return settings[key]
}

async function set(key: string, value: unknown): Promise<void> {
  const settings = await getAll()
  settings[key] = value
  await fileService.writeJson(paths.settingsFile(), settings)
}

export const settingsService = { getAll, get, set }
