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

## Extending

- **New state** → add a variant in `variants/` (states only, no timing).
- **New timing** → add/adjust a token in `transitions/`.
- **New UI pattern** → add a `MotionPreset` in `presets/` combining the two.

Then export it from the relevant file — the root `index.ts` re-exports each
module, so it's immediately available from `@renderer/animations`.
