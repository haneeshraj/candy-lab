import { useState, type ReactNode } from 'react'
import { Button } from '@renderer/components/ui'
import { useAuthStore, selectAuthPhase } from '@renderer/store'
import { Logo } from '../../assets/Logo'
import styles from './AuthGate.module.scss'

function peelError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    const match = error.message.match(/Error:\s(.*)$/)
    return match ? match[1] : error.message
  }
  return fallback
}

/** Sign-in screen — opens Google in the system browser. */
function LoginScreen(): React.JSX.Element {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await window.api.auth.signInWithGoogle()
      // On success the store updates via the auth-state broadcast.
    } catch (err) {
      setError(peelError(err, 'Sign-in failed. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.card}>
      <Logo width={56} height={56} />
      <h1 className={styles.title}>candy-lab</h1>
      <p className={styles.subtitle}>Sign in to request or use your access.</p>
      <Button onClick={() => void signIn()} disabled={busy}>
        {busy ? 'Opening browser…' : 'Continue with Google'}
      </Button>
      {busy && <p className={styles.hint}>Complete sign-in in your browser, then return here.</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

/** Shown while a request awaits admin approval. */
function PendingScreen({ email }: { email: string | null }): React.JSX.Element {
  const [checking, setChecking] = useState(false)

  const recheck = async (): Promise<void> => {
    setChecking(true)
    try {
      useAuthStore.getState().setAuth(await window.api.auth.getState())
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className={styles.card}>
      <Logo width={56} height={56} />
      <h1 className={styles.title}>Awaiting approval</h1>
      <p className={styles.subtitle}>
        Your request{email ? ` for ${email}` : ''} is pending. An admin needs to approve you before
        you can use the app.
      </p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => void recheck()} disabled={checking}>
          {checking ? 'Checking…' : 'Check again'}
        </Button>
        <Button variant="ghost" onClick={() => void window.api.auth.signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

/** Shown when a user has been banned / declined. */
function RestrictedScreen(): React.JSX.Element {
  return (
    <div className={styles.card}>
      <Logo width={56} height={56} />
      <h1 className={styles.title}>Access restricted</h1>
      <p className={styles.subtitle}>
        Your access has been declined. Contact an admin if you think this is a mistake.
      </p>
      <Button variant="ghost" onClick={() => void window.api.auth.signOut()}>
        Sign out
      </Button>
    </div>
  )
}

/**
 * Wraps the app shell: renders `children` only for approved users. Everyone else
 * sees the appropriate gate screen (loading / sign-in / pending / restricted).
 */
export function AuthGate({ children }: { children: ReactNode }): React.JSX.Element {
  const phase = useAuthStore(selectAuthPhase)
  const email = useAuthStore((state) => state.user?.email ?? null)

  if (phase === 'approved') return <>{children}</>

  return (
    <div className={styles.gate}>
      {phase === 'loading' && <p className={styles.loading}>Loading…</p>}
      {phase === 'signed-out' && <LoginScreen />}
      {phase === 'pending' && <PendingScreen email={email} />}
      {phase === 'restricted' && <RestrictedScreen />}
    </div>
  )
}
