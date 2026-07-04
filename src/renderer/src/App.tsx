import { motion } from 'motion/react'

import {
  heroContainer,
  heroItem,
  motionSafePreset,
  useReducedMotionSafe
} from '@renderer/animations'
import { Logo } from './assets/Logo'
import styles from './App.module.scss'

/**
 * Home page — a temporary animated "Coming Soon" placeholder. Content rises in
 * on a stagger; a breathing glow and shimmering title add ambient motion (both
 * pure CSS, so they're covered by the reduced-motion reset).
 */
function App(): React.JSX.Element {
  const reduced = useReducedMotionSafe()

  return (
    <div className={styles.home}>
      <div className={styles.glow} aria-hidden />

      <motion.div className={styles.content} {...motionSafePreset(heroContainer, reduced)}>
        {/* Children take only `variants`/`transition` so the container's
            stagger orchestrates them (see the animations README). */}
        <motion.div
          className={styles.logo}
          variants={heroItem.variants}
          transition={heroItem.transition}
        >
          <Logo width={64} height={64} />
        </motion.div>

        <motion.h1
          className={styles.title}
          variants={heroItem.variants}
          transition={heroItem.transition}
        >
          Coming Soon
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          variants={heroItem.variants}
          transition={heroItem.transition}
        >
          Something sweet is brewing in the lab. Check back shortly.
        </motion.p>

        <motion.div
          className={styles.badge}
          variants={heroItem.variants}
          transition={heroItem.transition}
        >
          <span className={styles.dot} />
          In development
        </motion.div>
      </motion.div>
    </div>
  )
}

export default App
