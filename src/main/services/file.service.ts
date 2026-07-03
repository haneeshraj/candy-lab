import { promises as fs } from 'fs'
import { logger } from '../utils/logger'

// Thin, reusable filesystem helpers. Higher-level services (e.g. settings)
// build on these instead of touching `fs` directly.

export const fileService = {
  /** Read + parse a JSON file, returning `fallback` if missing or invalid. */
  async readJson<T>(filePath: string, fallback: T): Promise<T> {
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },

  /** Serialize + write a JSON file (pretty-printed). */
  async writeJson(filePath: string, data: unknown): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      logger.error('Failed to write JSON', filePath, error)
      throw error
    }
  }
}
