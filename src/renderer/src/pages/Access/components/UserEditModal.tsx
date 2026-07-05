import { useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Button, Checkbox, TextArea, TextField } from '@renderer/components/ui'
import type { Profile } from '@renderer/store'
import { errorMessage } from '../utils'
import styles from './UserEditModal.module.scss'

interface UserEditModalProps {
  /** The user being edited, or null when closed. */
  user: Profile | null
  /** The signed-in admin's id (their own role toggle is disabled). */
  currentUserId: string | null
  onClose: () => void
  onSaved: () => void
}

function UserForm({
  user,
  currentUserId,
  onClose,
  onSaved
}: {
  user: Profile
  currentUserId: string | null
  onClose: () => void
  onSaved: () => void
}): React.JSX.Element {
  const [name, setName] = useState(user.name ?? '')
  const [notes, setNotes] = useState(user.notes ?? '')
  const [isAdmin, setIsAdmin] = useState(user.role === 'admin')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isSelf = user.id === currentUserId

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await window.api.access.updateUser(user.id, { name: name.trim(), notes })
      if (!isSelf && isAdmin !== (user.role === 'admin')) {
        await window.api.access.setRole(user.id, isAdmin ? 'admin' : 'user')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Failed to save user.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={save}>
      <TextField label="Email" value={user.email} readOnly disabled />
      <TextField
        label="Name"
        value={name}
        placeholder="Display name"
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
      <TextArea
        label="Notes"
        value={notes}
        placeholder="Admin-only notes"
        onChange={(event) => setNotes(event.target.value)}
      />
      <Checkbox
        label="Admin"
        description={
          isSelf ? "You can't change your own role." : 'Can approve, ban, and manage other users.'
        }
        checked={isAdmin}
        disabled={isSelf}
        onChange={(event) => setIsAdmin(event.target.checked)}
      />

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

/** Modal for editing a user's name, notes, and admin role (email is locked). */
export function UserEditModal({
  user,
  currentUserId,
  onClose,
  onSaved
}: UserEditModalProps): React.JSX.Element {
  return (
    <Modal isOpen={user !== null} onClose={onClose} title="Edit user">
      {user && (
        <UserForm user={user} currentUserId={currentUserId} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  )
}
