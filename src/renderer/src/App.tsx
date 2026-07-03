import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
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
        <a
          className={styles.action}
          href="https://electron-vite.org/"
          target="_blank"
          rel="noreferrer"
        >
          Documentation
        </a>
        <a className={styles.action} target="_blank" rel="noreferrer" onClick={ipcHandle}>
          Send IPC
        </a>
      </div>
      <Versions />
    </div>
  )
}

export default App
