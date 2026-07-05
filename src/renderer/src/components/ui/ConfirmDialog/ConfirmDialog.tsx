import { Modal } from '@renderer/components/Modal'
import { Button } from '../Button/Button'
import styles from './ConfirmDialog.module.scss'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Style the confirm action as destructive. */
  danger?: boolean
  /** Disable actions while the confirm is in flight. */
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** A small confirmation modal built on `Modal`, for destructive/irreversible
 * actions like deleting a release. */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onClose
}: ConfirmDialogProps): React.JSX.Element {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.root}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
