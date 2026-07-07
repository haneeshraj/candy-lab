import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import {
  menuItem,
  motionSafePreset,
  useReducedMotionSafe,
  userMenuPanel
} from '@renderer/animations'
import { useOnClickOutside } from '@renderer/hooks'
import { useAuthStore } from '@renderer/store'
import { IconBug, IconEdit, IconLogout, IconSettings } from '../../assets/icons'
import styles from './UserBar.module.scss'

// TODO: point this at the real repository (mirrors the one in MenuBar).
const ISSUES_URL = 'https://github.com/haneeshraj/candy-lab/issues'

interface UserAction {
  label: string
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
  onSelect: () => void
  /** Styles the item as destructive (used for Log out). */
  danger?: boolean
}

/** First letters of the first two words, else the first two characters. */
function initials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return text.slice(0, 2).toUpperCase()
}

/** Deterministic gradient from a seed so each user gets a stable avatar color. */
function gradientFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${hue} 62% 55%), hsl(${(hue + 42) % 360} 62% 45%))`
}

/**
 * Floating user bar pinned bottom-left, beside the sidebar rail. Shows the
 * signed-in user's avatar, name, and role, plus a gear that opens an upward
 * slide + stagger panel of account actions. Rendered only for approved users
 * (it lives inside `AuthGate`), so `profile` is expected to be present — it
 * still guards for null to stay safe.
 */
export function UserBar(): React.JSX.Element | null {
  const profile = useAuthStore((state) => state.profile)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setOpen(false))

  const reduced = useReducedMotionSafe()
  const panelMotion = motionSafePreset(userMenuPanel, reduced)
  const itemMotion = motionSafePreset(menuItem, reduced)

  if (!profile) return null

  const name = profile.name ?? profile.email
  const role = profile.role === 'admin' ? 'Admin' : 'Member'

  const actions: UserAction[] = [
    // TODO: no Settings surface yet — wire to a settings modal/page when it exists.
    { label: 'Settings', Icon: IconSettings, onSelect: () => {} },
    // TODO: no Edit-profile surface yet — wire to a profile modal when it exists.
    { label: 'Edit profile', Icon: IconEdit, onSelect: () => {} },
    {
      label: 'Report a bug',
      Icon: IconBug,
      onSelect: () => void window.api.system.openExternal(ISSUES_URL)
    },
    {
      label: 'Log out',
      Icon: IconLogout,
      danger: true,
      onSelect: () => void window.api.auth.signOut()
    }
  ]

  const select = (action: UserAction): void => {
    action.onSelect()
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <AnimatePresence>
        {open && (
          <motion.ul className={styles.panel} {...panelMotion}>
            {actions.map((action) => (
              // Only variants/transition — items inherit hidden→visible→exit
              // from the panel, so its stagger actually cascades.
              <motion.li
                key={action.label}
                variants={itemMotion.variants}
                transition={itemMotion.transition}
              >
                <button
                  type="button"
                  className={`${styles.action} ${action.danger ? styles.danger : ''}`}
                  onClick={() => select(action)}
                >
                  <action.Icon width={16} height={16} />
                  <span>{action.label}</span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={styles.bar}
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.avatar} style={{ backgroundImage: gradientFor(name) }} aria-hidden>
          {initials(name)}
        </span>

        <div className={styles.identity}>
          <span className={styles.name} title={name}>
            {name}
          </span>
          <span className={styles.role}>{role}</span>
        </div>

        <span className={`${styles.gear} ${open ? styles.gearOpen : ''}`} aria-hidden>
          <IconSettings width={18} height={18} />
        </span>
      </button>
    </div>
  )
}
