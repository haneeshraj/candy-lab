import { Link } from 'react-router-dom'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { ROUTE_PATHS } from './router/routePaths'
import styles from './App.module.scss'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className={styles.app}>
      <img alt="logo" className={styles.logo} src={electronLogo} />
      <div className={styles.creator}>Powered by electron-vite</div>
      <div className={styles.text}>
        Build an Electron app with <span className={styles.react}>React</span>
        &nbsp;and <span className={styles.ts}>TypeScript</span>
      </div>
      <p className={styles.tip}>
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className={styles.actions}>
        <Link className={styles.action} to={ROUTE_PATHS.RELEASES}>
          Releases
        </Link>
        <a className={styles.action} target="_blank" rel="noreferrer" onClick={ipcHandle}>
          Send IPC
        </a>
      </div>
      <Versions />
    </div>
  )
}

export default App
