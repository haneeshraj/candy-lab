import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnClickOutside } from '@renderer/hooks'
import { useElectronStore } from '@renderer/store'
import { ROUTE_PATHS } from '../../router/routePaths'
import logo from '../../assets/Logo.svg'
import styles from './MenuBar.module.scss'

// TODO: point these at your real repository.
const ISSUES_URL = 'https://github.com/your-org/candy-lab/issues'
const RELEASES_URL = 'https://github.com/your-org/candy-lab/releases'

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
  const setUpdateStatus = useElectronStore((state) => state.setUpdateStatus)

  const close = useCallback((): void => setOpenId(null), [])
  useOnClickOutside(ref, close)

  const openExternal = (url: string): void => {
    void window.api.system.openExternal(url)
  }

  const menus: Menu[] = [
    {
      id: 'help',
      label: 'Help',
      items: [
        // TODO: open an App Info dialog.
        { label: 'App Info', onSelect: () => undefined },
        { label: 'Report Bug', onSelect: () => openExternal(ISSUES_URL) }
      ]
    },
    {
      id: 'updates',
      label: 'Updates',
      items: [
        // TODO: trigger a real update check over IPC once the updater is wired.
        { label: 'Check for updates', onSelect: () => setUpdateStatus('checking') },
        {
          label: 'Update available — download & install',
          show: updateStatus === 'available',
          // TODO: trigger download + install over IPC.
          onSelect: () => setUpdateStatus('downloading')
        },
        { label: 'Release Notes', onSelect: () => openExternal(RELEASES_URL) }
      ]
    }
  ]

  const select = (item: MenuItem): void => {
    item.onSelect()
    close()
  }

  return (
    <div className={styles.menubar} ref={ref}>
      <button
        type="button"
        className={styles.logo}
        aria-label="Home"
        onClick={() => navigate(ROUTE_PATHS.ROOT)}
      >
        <img src={logo} width={20} height={20} alt="" />
      </button>

      {menus.map((menu) => (
        <div key={menu.id} className={styles.menu}>
          <button
            type="button"
            className={styles.trigger}
            onClick={() => setOpenId((current) => (current === menu.id ? null : menu.id))}
          >
            {menu.label}
          </button>

          {openId === menu.id && (
            <ul className={styles.dropdown}>
              {menu.items
                .filter((item) => item.show !== false)
                .map((item) => (
                  <li key={item.label}>
                    <button type="button" className={styles.item} onClick={() => select(item)}>
                      {item.label}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
