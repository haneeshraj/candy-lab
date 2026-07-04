import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

import {
  modalBackdrop,
  modalContent,
  motionSafePreset,
  useReducedMotionSafe
} from '@renderer/animations'
import { IconClose } from '../../assets/icons'
import styles from './Modal.module.scss'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

/**
 * Reusable animated modal — a fading backdrop with a spring-in dialog, rendered
 * in a portal on `document.body` so it escapes any clipping/stacking context.
 * Closes on backdrop click, the close button, or Escape. Presentational only:
 * the caller owns the open state (see `MenuBar` for wiring via the UI store).
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps): React.JSX.Element {
  const reduced = useReducedMotionSafe()

  // Close on Escape while open.
  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          onClick={onClose}
          {...motionSafePreset(modalBackdrop, reduced)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={styles.dialog}
            onClick={(event) => event.stopPropagation()} // clicks inside never close
            {...motionSafePreset(modalContent, reduced)}
          >
            <header className={styles.header}>
              <h2 className={styles.title}>{title}</h2>
              <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
                <IconClose width={18} height={18} />
              </button>
            </header>

            <div className={styles.body}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
