import { NavLink } from 'react-router-dom'
import type { NavLinkProps } from 'react-router-dom'

import { useTransitionNavigate } from './useTransitionNavigate'

/**
 * Drop-in replacement for react-router's `NavLink` that routes through the page
 * transition instead of navigating instantly. Keeps the full `NavLink` API
 * (including the `isActive` render-prop `className`/`style` and `end`), so
 * existing active-state styling keeps working.
 *
 * Modifier-clicks and non-primary buttons fall through to the browser's default
 * so "open in new window" etc. still behave normally.
 */
export function TransitionLink({ to, onClick, ...rest }: NavLinkProps): React.JSX.Element {
  const transitionTo = useTransitionNavigate()

  return (
    <NavLink
      to={to}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }

        // The app addresses routes with plain string paths; if a `To` object is
        // ever passed, fall back to react-router's own default navigation.
        if (typeof to !== 'string') return

        event.preventDefault()
        transitionTo(to)
      }}
      {...rest}
    />
  )
}
