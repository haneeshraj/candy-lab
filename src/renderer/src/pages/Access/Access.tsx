import { useMemo, useState } from 'react'
import { useAuthStore, type AccessStatus, type Profile } from '@renderer/store'
import { IconBan, IconCheck, IconEdit } from '../../assets/icons'
import { useUsers } from './hooks/useUsers'
import { UserEditModal } from './components/UserEditModal'
import { errorMessage } from './utils'
import styles from './Access.module.scss'

const SECTIONS: { status: AccessStatus; label: string }[] = [
  { status: 'pending', label: 'Pending requests' },
  { status: 'approved', label: 'Approved' },
  { status: 'banned', label: 'Banned' }
]

/** Admin-only user management: approve / ban access requests and edit profiles. */
export default function Access(): React.JSX.Element {
  const isAdmin = useAuthStore(
    (state) => state.profile?.role === 'admin' && state.profile?.status === 'approved'
  )
  const currentUserId = useAuthStore((state) => state.user?.id ?? null)

  const { users, loading, error, reload } = useUsers()
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Profile | null>(null)

  const grouped = useMemo(() => {
    const map: Record<AccessStatus, Profile[]> = { pending: [], approved: [], banned: [] }
    for (const user of users) map[user.status].push(user)
    return map
  }, [users])

  if (!isAdmin) {
    return (
      <div className={styles.access}>
        <p className={styles.state}>You don’t have access to this page.</p>
      </div>
    )
  }

  const act = async (fn: () => Promise<unknown>): Promise<void> => {
    setActionError(null)
    try {
      await fn()
      await reload()
    } catch (err) {
      setActionError(errorMessage(err, 'Action failed.'))
    }
  }

  const setStatus = (id: string, status: AccessStatus): Promise<void> =>
    act(() => window.api.access.setStatus(id, status))

  return (
    <div className={styles.access}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Access</h1>
          <p className={styles.subtitle}>Approve, ban, and manage who can use the app.</p>
        </div>
      </header>

      {actionError && <p className={styles.error}>{actionError}</p>}

      {loading ? (
        <p className={styles.state}>Loading users…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : users.length === 0 ? (
        <p className={styles.state}>No users yet.</p>
      ) : (
        SECTIONS.map(({ status, label }) => {
          const group = grouped[status]
          if (group.length === 0) return null
          return (
            <section key={status} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {label} <span className={styles.count}>{group.length}</span>
              </h2>
              <ul className={styles.list}>
                {group.map((user) => {
                  const isSelf = user.id === currentUserId
                  return (
                    <li key={user.id} className={styles.row}>
                      <div className={styles.info}>
                        <div className={styles.nameRow}>
                          <span className={styles.name}>{user.name || user.email}</span>
                          {user.role === 'admin' && <span className={styles.admin}>Admin</span>}
                          {isSelf && <span className={styles.you}>You</span>}
                        </div>
                        <span className={styles.email}>{user.email}</span>
                        {user.notes && <span className={styles.notes}>{user.notes}</span>}
                      </div>

                      <div className={styles.actions}>
                        {!isSelf && status !== 'approved' && (
                          <button
                            type="button"
                            className={`${styles.action} ${styles.approve}`}
                            aria-label={`Approve ${user.email}`}
                            title="Approve"
                            onClick={() => void setStatus(user.id, 'approved')}
                          >
                            <IconCheck width={16} height={16} />
                          </button>
                        )}
                        {!isSelf && status !== 'banned' && (
                          <button
                            type="button"
                            className={`${styles.action} ${styles.ban}`}
                            aria-label={`Ban ${user.email}`}
                            title="Ban"
                            onClick={() => void setStatus(user.id, 'banned')}
                          >
                            <IconBan width={16} height={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.action}
                          aria-label={`Edit ${user.email}`}
                          title="Edit"
                          onClick={() => setEditing(user)}
                        >
                          <IconEdit width={16} height={16} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}

      <UserEditModal
        user={editing}
        currentUserId={currentUserId}
        onClose={() => setEditing(null)}
        onSaved={() => void reload()}
      />
    </div>
  )
}
