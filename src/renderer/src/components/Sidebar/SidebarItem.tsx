import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'

import { motionSafePreset, sidebarTooltip } from '@renderer/animations'
import styles from './Sidebar.module.scss'

interface SidebarItemProps {
  to: string
  label: string
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
  reduced: boolean
}

/**
 * One nav entry: an always-visible icon with a hover tooltip to its right
 * naming the page it links to.
 */
export function SidebarItem({ to, label, Icon, reduced }: SidebarItemProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={styles.itemWrap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NavLink
        to={to}
        end
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
      >
        <span className={styles.icon}>
          <Icon width={20} height={20} />
        </span>
      </NavLink>

      <AnimatePresence>
        {hovered && (
          <motion.span
            role="tooltip"
            className={styles.tooltip}
            // Vertical centering lives in `translateY`; the preset animates `x`,
            // and motion composes both into one transform.
            style={{ translateY: '-50%' }}
            {...motionSafePreset(sidebarTooltip, reduced)}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
