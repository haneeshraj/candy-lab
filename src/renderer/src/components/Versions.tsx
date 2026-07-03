import { useState } from 'react'
import styles from './Versions.module.scss'

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <ul className={styles.versions}>
      <li className={styles.item}>Electron v{versions.electron}</li>
      <li className={styles.item}>Chromium v{versions.chrome}</li>
      <li className={styles.item}>Node v{versions.node}</li>
    </ul>
  )
}

export default Versions
