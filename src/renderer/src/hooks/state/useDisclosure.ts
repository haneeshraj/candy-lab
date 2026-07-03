import { useCallback, useMemo, useState } from 'react'

export interface Disclosure {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Open/close state for overlays (modals, drawers, dropdowns, popovers). Named
 * actions read better at call sites than a raw boolean setter.
 *
 *   const menu = useDisclosure()
 *   <button onClick={menu.toggle} /> ; {menu.isOpen && <Menu onClose={menu.close} />}
 */
export function useDisclosure(initial = false): Disclosure {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback((): void => setIsOpen(true), [])
  const close = useCallback((): void => setIsOpen(false), [])
  const toggle = useCallback((): void => setIsOpen((prev) => !prev), [])

  return useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])
}
