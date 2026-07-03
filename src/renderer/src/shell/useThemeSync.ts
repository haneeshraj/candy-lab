import { useEffect } from 'react'
import { useSettingsStore } from '@renderer/store'
import { useMediaQuery } from '@renderer/hooks'

/**
 * Applies the settings-store theme to `<html data-theme>`, which the SCSS
 * themes key off. `'system'` follows the OS via `prefers-color-scheme` (and
 * reacts to OS changes, since `useMediaQuery` is reactive).
 */
export function useThemeSync(): void {
  const theme = useSettingsStore((state) => state.theme)
  const prefersLight = useMediaQuery('(prefers-color-scheme: light)')

  useEffect(() => {
    const resolved = theme === 'system' ? (prefersLight ? 'light' : 'dark') : theme
    document.documentElement.dataset.theme = resolved
  }, [theme, prefersLight])
}
