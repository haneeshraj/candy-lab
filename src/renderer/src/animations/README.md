# Animation System

A small, centralized animation layer built on [`motion`](https://motion.dev)
(the React package). Everything lives in `src/renderer/src/animations` and is
consumed from `@renderer/animations`.

## Overview

**Why it exists:** to keep animation logic out of components. Components _use_
animations; they don't _define_ them. That means motion stays consistent
(same durations, easings, and patterns everywhere), reusable, and easy to tune
in one place.

**Import surface** — everything is re-exported from the root barrel:

```ts
import { pageSlide, fade, defaultTransition, useReducedMotionSafe } from '@renderer/animations'
```

## Architecture

Three layers, low → high:

| Layer           | Answers…                  | Contains                                                        |
| --------------- | ------------------------- | --------------------------------------------------------------- |
| **variants**    | _What_ the animation does | State maps: `hidden` / `visible` / `exit`. No timing.           |
| **transitions** | _How_ it moves            | Duration + easing tokens (`default`, `fast`, `slow`, `spring`). |
| **presets**     | Real UI behavior          | variants + a transition, ready to spread onto a component.      |

Plus **hooks** (reduced-motion, imperative controls) and **utils** (delay
helpers, reduced-motion wrappers, the `MotionPreset` type).

```
animations/
├── variants/     fade · slide · scale · stagger
├── transitions/  default · fast · slow · spring
├── presets/      pageTransitions · modalAnimations · listAnimations · dropdownAnimations
├── hooks/        useReducedMotionSafe · useMotionControls
├── utils/        delay · motionSafe · types
└── index.ts      barrel (import from here)
```

## Usage examples

> These snippets show the API only — no components ship with this system.

**Preset (recommended)** — spread a ready-made pattern:

```tsx
import { motion } from 'motion/react'
import { pageSlide } from '@renderer/animations'

;<motion.div {...pageSlide}>{children}</motion.div>
```

**Variant + transition** — compose your own:

```tsx
import { motion } from 'motion/react'
import { fade, fastTransition } from '@renderer/animations'

;<motion.div variants={fade} initial="hidden" animate="visible" transition={fastTransition} />
```

**List stagger** — container + items:

```tsx
import { motion } from 'motion/react'
import { listContainer, listItem } from '@renderer/animations'

;<motion.ul {...listContainer}>
  {rows.map((row) => (
    <motion.li key={row.id} {...listItem} />
  ))}
</motion.ul>
```

**Reduced motion** — respect the OS setting:

```tsx
import { motion } from 'motion/react'
import { modalContent, useReducedMotionSafe, motionSafePreset } from '@renderer/animations'

const reduced = useReducedMotionSafe()
;<motion.div {...motionSafePreset(modalContent, reduced)} />
```

## Rules

- ❌ **No inline animation objects in components.** No variants, durations, or
  easings defined in a `.tsx` file.
- ✔ **All motion comes from `@renderer/animations`.**
- ❌ **No hardcoded timing/easing** in components — use `transitions` tokens.
- ❌ **No duplicate definitions.** Reuse variants/presets; add a new one here if
  a pattern is missing.
- ✔ **Performance:** animate `transform` (`x`/`y`/`scale`) and `opacity` only —
  never layout properties (`width`, `top`, `margin`). All variants here follow this.
- ✔ **Accessibility:** gate motion behind `useReducedMotionSafe` /
  `motionSafePreset` for anything beyond a simple fade.

## How to add / modify

The three layers map to three kinds of change: **variant** (a new motion
_state_), **transition** (new timing), **preset** (a reusable UI pattern
combining the two). The root `index.ts` re-exports every module, so anything you
export is immediately available from `@renderer/animations`.

### Add a new variant

File: `animations/variants/<name>.ts`. States only (`hidden`/`visible`/`exit`),
**no timing**, `transform`/`opacity` only.

```ts
// animations/variants/blur.ts
import type { Variants } from 'motion/react'

export const blur: Variants = {
  hidden: { opacity: 0, filter: 'blur(4px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' }
}
```

Then add `export * from './variants/blur'` to `animations/index.ts`.

### Add a new transition

File: `animations/transitions/<name>.ts`. Reuse the shared tokens (`duration`,
`easeStandard`, …) from `transitions/default.ts` instead of hardcoding numbers.

```ts
// animations/transitions/gentle.ts
import type { Transition } from 'motion/react'
import { duration, easeOut } from './default'

export const gentleTransition: Transition = {
  duration: duration.slow,
  ease: easeOut
}
```

Add `export * from './transitions/gentle'` to `animations/index.ts`.

### Add a new preset

File: `animations/presets/<name>.ts`. Combine a variant + a transition into a
ready-to-spread `MotionPreset`.

```ts
// animations/presets/toastAnimations.ts
import type { MotionPreset } from '../utils/types'
import { slideUp } from '../variants/slide'
import { springTransition } from '../transitions/spring'

export const toast: MotionPreset = {
  variants: slideUp,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: springTransition
}
```

Add `export * from './presets/toastAnimations'` to `animations/index.ts`.
Usage: `<motion.div {...toast} />`.

### Modify an existing element safely

- **Variant:** keep `hidden`/`visible`/`exit` symmetric and transform/opacity-only;
  don't add duration/easing (that belongs in a transition).
- **Transition:** adjust the token in `transitions/default.ts` to change timing
  app-wide, or edit the specific transition for a local change.
- **Preset:** re-point its `variants`/`transition`; every consumer updates at once
  — check callers if you change its behavior meaningfully.

### Common mistakes

- ❌ Defining variants/durations inline in a `.tsx` component — put them here.
- ❌ Putting timing inside a variant (except `staggerChildren` orchestration).
- ❌ Animating layout properties (`width`, `top`, `margin`) — use `x`/`y`/`scale`.
- ❌ Hardcoding easing/duration numbers — reference the `transitions` tokens.
- ❌ Adding `@keyframes` here — those are global CSS (see `styles/`), not motion variants.
