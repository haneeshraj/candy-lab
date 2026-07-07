import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'

import { menuItem, menuPanel, motionSafePreset, useReducedMotionSafe } from '@renderer/animations'
import { useOnClickOutside } from '@renderer/hooks'
import { useElectronStore, useUIStore } from '@renderer/store'
import { ROUTE_PATHS } from '../../router/routePaths'
import { Logo } from '../../assets/Logo'
import { AppInfoContent } from '../AppInfo'
import { Modal } from '../Modal'
import { ReleaseNotesContent } from '../ReleaseNotes'
import { UpdaterContent } from '../Updater'
import styles from './MenuBar.module.scss'

// TODO: point this at your real repository.
const ISSUES_URL = 'https://github.com/your-org/candy-lab/issues'

// Modal identifiers, keyed in the UI store's `openModals`.
const MODAL_APP_INFO = 'app-info'
const MODAL_CHECK_UPDATES = 'check-updates'
const MODAL_RELEASE_NOTES = 'release-notes'

interface MenuItem {
  label: string
  onSelect: () => void
  /** When explicitly `false`, the item is hidden (e.g. "Update available"). */
  show?: boolean
}

interface Menu {
  id: string
  label: string
  items: MenuItem[]
  show?: boolean
}

/**
 * Simple menu-bar on the left of the title bar. Opens on click, closes on
 * outside click (via `useOnClickOutside`) or after selecting an item. Styling
 * is intentionally minimal — meant to be restyled.
 */
export function MenuBar(): React.JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const updateStatus = useElectronStore((state) => state.updateStatus)

  const openModals = useUIStore((state) => state.openModals)
  const openModal = useUIStore((state) => state.openModal)
  const closeModal = useUIStore((state) => state.closeModal)

  const close = useCallback((): void => setOpenId(null), [])
  useOnClickOutside(ref, close)

  const reduced = useReducedMotionSafe()
  const panelMotion = motionSafePreset(menuPanel, reduced)
  const itemMotion = motionSafePreset(menuItem, reduced)

  const openExternal = (url: string): void => {
    void window.api.system.openExternal(url)
  }

  const menus: Menu[] = [
    {
      id: 'updates',
      label: 'Updates',
      items: [
        {
          label: 'Check for updates',
          onSelect: () => {
            void window.api.updater.check()
            openModal(MODAL_CHECK_UPDATES)
          }
        },
        {
          // Updates download automatically; this appears once one is ready to install.
          label: 'Restart to install update',
          show: updateStatus === 'ready',
          onSelect: () => window.api.updater.install()
        },
        { label: 'Release Notes', onSelect: () => openModal(MODAL_RELEASE_NOTES) }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'App Info', onSelect: () => openModal(MODAL_APP_INFO) },
        { label: 'Report Bug', onSelect: () => openExternal(ISSUES_URL) }
      ]
    }
  ]

  const select = (item: MenuItem): void => {
    item.onSelect()
    close()
  }

  return (
    <>
      <div className={styles.menubar} ref={ref}>
        <button
          type="button"
          className={styles.logo}
          aria-label="Home"
          onClick={() => navigate(ROUTE_PATHS.ROOT)}
        >
          <Logo width={20} height={20} />
        </button>

        {menus
          .filter((menu) => menu.show !== false)
          .map((menu) => (
            <div key={menu.id} className={styles.menu}>
              <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpenId((current) => (current === menu.id ? null : menu.id))}
              >
                {menu.label}
              </button>

              <AnimatePresence>
                {openId === menu.id && (
                  <motion.ul className={styles.dropdown} {...panelMotion}>
                    {menu.items
                      .filter((item) => item.show !== false)
                      .map((item) => (
                        // Only `variants`/`transition` — the items inherit their
                        // hidden→visible→exit state from the panel, so its
                        // `staggerChildren` / `delayChildren` actually cascade.
                        <motion.li
                          key={item.label}
                          variants={itemMotion.variants}
                          transition={itemMotion.transition}
                        >
                          <button
                            type="button"
                            className={styles.item}
                            onClick={() => select(item)}
                          >
                            {item.label}
                          </button>
                        </motion.li>
                      ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          ))}
      </div>

      <Modal
        isOpen={openModals.includes(MODAL_APP_INFO)}
        onClose={() => closeModal(MODAL_APP_INFO)}
        title="App Info"
      >
        <AppInfoContent />
      </Modal>
      <Modal
        isOpen={openModals.includes(MODAL_CHECK_UPDATES)}
        onClose={() => closeModal(MODAL_CHECK_UPDATES)}
        title="Check for updates"
      >
        <UpdaterContent />
      </Modal>
      <Modal
        isOpen={openModals.includes(MODAL_RELEASE_NOTES)}
        onClose={() => closeModal(MODAL_RELEASE_NOTES)}
        title="Release Notes"
        size="lg"
      >
        <ReleaseNotesContent />
      </Modal>
    </>
  )
}
