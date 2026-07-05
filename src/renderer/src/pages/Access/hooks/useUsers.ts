import { useCallback, useEffect, useState } from 'react'
import type { Profile } from '@renderer/store'
import { errorMessage } from '../utils'

interface UseUsers {
  users: Profile[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/**
 * Loads the full user list (admin only) and tracks loading/error state. The
 * mount fetch writes state only after `await` (cancelled-guarded); `reload` is
 * for event handlers after an approve/ban/edit.
 */
export function useUsers(): UseUsers {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const data = await window.api.access.listUsers()
        if (!cancelled) {
          setUsers(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Failed to load users.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      setUsers(await window.api.access.listUsers())
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Failed to load users.'))
    } finally {
      setLoading(false)
    }
  }, [])

  return { users, loading, error, reload }
}
