/**
 * Small line icons as inline SVGs. Like `Logo`, they draw with `currentColor`
 * (here via `stroke`), so recoloring is just `color: …` on an ancestor. Sized
 * through the standard SVG `width`/`height` props.
 */

/** Shared base — a 24×24 stroked icon that inherits color and sizing. */
function Icon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      {...props}
    />
  )
}

/** Hamburger — toggles the sidebar open/closed. */
export function IconMenu(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Icon>
  )
}

/** House — the Home route. */
export function IconHome(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <path d="M3 10l9-7 9 7" />
      <path d="M5 9v11h14V9" />
    </Icon>
  )
}

/** Tag — the Releases route. */
export function IconReleases(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <path d="M20.59 13.41 12 22l-9-9V4h9l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </Icon>
  )
}

/** X — dismisses a modal / overlay. */
export function IconClose(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Icon>
  )
}
