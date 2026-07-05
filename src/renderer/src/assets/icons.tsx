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

/** Pencil — edit a release. */
export function IconEdit(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Icon>
  )
}

/** Trash — delete a release. */
export function IconTrash(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Icon>
  )
}

/** People — the Access (user management) route. */
export function IconUsers(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  )
}

/** Check — approve / grant access. */
export function IconCheck(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  )
}

/** Ban — decline / revoke access. */
export function IconBan(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
    </Icon>
  )
}
