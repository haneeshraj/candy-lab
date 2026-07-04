# Styling Guide

How styling works in this Electron + React application, and how to work within
it. Read this once before writing styles. For an exhaustive catalog of every
token, function, mixin, and utility class, see **[REFERENCE.md](./REFERENCE.md)**.

---

## Table of contents

1. [Philosophy](#1-philosophy)
2. [The two-layer token model](#2-the-two-layer-token-model)
3. [Folder structure](#3-folder-structure)
4. [How the module graph fits together](#4-how-the-module-graph-fits-together)
5. [Global SCSS vs. CSS Modules](#5-global-scss-vs-css-modules)
6. [Styling a component (step by step)](#6-styling-a-component-step-by-step)
7. [Using tokens, functions & mixins](#7-using-tokens-functions--mixins)
8. [Utility classes](#8-utility-classes)
9. [The color system & design tokens](#9-the-color-system--design-tokens)
10. [Theming](#10-theming)
11. [Responsive & window resizing](#11-responsive--window-resizing)
12. [Animations](#12-animations)
13. [Electron / Chromium considerations](#13-electron--chromium-considerations)
14. [Naming conventions](#14-naming-conventions)
15. [Do's & Don'ts](#15-dos--donts)
16. [Recipes](#16-recipes)
17. [FAQ](#17-faq)

---

## 1. Philosophy

Four principles drive every decision in this system:

- **Single source of truth.** A value (a color, a spacing step, a breakpoint)
  is defined exactly once. Everything else references it. Change it in one place
  and the whole app follows.
- **Tokens over literals.** You should almost never type a raw `#hex`, `px`, or
  `ms` value in a component. If you find yourself doing so, the token is either
  missing (add it) or you're solving the wrong problem.
- **Output-free tools.** The `abstracts/` layer (variables, functions, mixins)
  emits **zero CSS**. You can `@use` it in a hundred files with no duplication.
  CSS is only emitted by `base/`, `layout/`, `utilities/`, and `themes/`.
- **Runtime theming, compile-time ergonomics.** You write `color: $primary;`
  (nice, short, autocompleted) and it compiles to `var(--color-primary)`, which
  can be swapped live by changing a `data-theme` attribute — no rebuild.

---

## 2. The two-layer token model

This is the most important concept in the system. Colors flow through **three
stages**:

```
  Raw palette (SCSS)          Semantic tokens (CSS vars)        SCSS pointer
  abstracts/_colors.scss      themes/_dark.scss & _light.scss   abstracts/_colors.scss
┌───────────────────────┐   ┌────────────────────────────┐   ┌────────────────────────┐
│ $palette-gold: #C69953 │──▶│ --color-primary: #C69953   │◀──│ $primary: var(--color- │
│  (the only hex allowed)│   │   (per theme, on :root)    │   │           primary)     │
└───────────────────────┘   └────────────────────────────┘   └────────────────────────┘
                                                                          │
                                                        you write ────────┘
                                                        `color: $primary;`
                                                        → `color: var(--color-primary);`
```

Why three stages instead of just using `$palette-gold` directly?

- **Palette** = the brand's fixed ink. Never referenced directly in components.
- **Semantic token** = the _role_ a color plays ("primary action", "surface").
  Defined per theme as a CSS custom property, so it changes at runtime.
- **SCSS pointer** = ergonomic sugar. `$primary` is easier to type and reason
  about than `var(--color-primary)`, and keeps component code readable.

The same idea applies to **shadows** (themeable → CSS vars). Spacing, radius,
typography, z-index, and motion are theme-independent, so they stay as plain
SCSS values (no runtime indirection needed).

> **Consequence:** SCSS color math (`lighten`, `darken`, `color.adjust`) can't
> operate on a `var()`. That's why the color helpers (`with-alpha`, `tint`,
> `shade`) are built on CSS `color-mix()` instead — they work on themed tokens.

---

## 3. Folder structure

```
styles/
├── abstracts/    Tokens & tools — NO CSS output. @use anywhere freely.
│   ├── _colors.scss       Raw palette + semantic color tokens
│   ├── _variables.scss    Typography, spacing, radius, shadows, motion, sizing
│   ├── _functions.scss    rem(), em(), with-alpha(), tint(), shade()
│   ├── _mixins.scss       flex, grid, card, glass, button-base, truncate…
│   ├── _breakpoints.scss  media() / media-max() + $breakpoints map
│   ├── _animations.scss   global @keyframes (NOT forwarded — see §12)
│   ├── _z-index.scss      z() + $z-layers map
│   └── _index.scss        forwards the output-free abstracts
│
├── base/         Element-level defaults (emits CSS)
│   ├── _reset.scss        Modern reset + reduced-motion
│   ├── _typography.scss   html/body/headings/labels defaults
│   ├── _globals.scss      links, buttons, inputs, focus rings
│   ├── _scrollbar.scss    Custom Chromium scrollbars
│   └── _selection.scss    ::selection colors
│
├── layout/       Structural building blocks
│   ├── _app.scss          App shell (full-height, resizable window)
│   ├── _containers.scss   Width-constrained wrappers
│   ├── _grid.scss         Grid helpers
│   └── _spacing.scss      stack / cluster / section flow primitives
│
├── utilities/    Atomic single-purpose classes
│   ├── _display.scss      block / inline-block / …
│   ├── _flex.scss         flex, flex-center, gap-*
│   ├── _spacing.scss      m-* / p-* generated from the scale
│   ├── _visibility.scss   hidden, sr-only, pointer, select-none
│   └── _helpers.scss      w-full, rounded, shadow, drag/no-drag
│
├── themes/       Semantic tokens as CSS custom properties
│   ├── _dark.scss         Default theme (on :root)
│   └── _light.scss        Opt-in via [data-theme='light']
│
├── vendors/      Third-party stylesheet overrides (empty for now)
│
├── main.scss     Global entry — imported once in main.tsx
├── GUIDE.md      This file
└── REFERENCE.md  The full token/function/mixin/utility catalog
```

**`main.scss` import order** (specific-ness increases downward):

```
abstracts → base → layout → utilities → themes → vendors
```

---

## 4. How the module graph fits together

Modern Sass (`@use`/`@forward`) is namespaced and load-once. A few rules keep
the graph clean and acyclic:

- **`abstracts/_index.scss`** forwards only the _output-free_ partials
  (`functions`, `colors`, `breakpoints`, `z-index`, `variables`, `mixins`).
  Doing `@use 'abstracts' as *;` gives you everything with no CSS side effects.
- **`_animations.scss` is intentionally excluded** from that barrel. Keyframes
  emit CSS; if they were pulled into a `*.module.scss`, the CSS Modules compiler
  would hash the keyframe _names_. Instead they're emitted once, globally, from
  `main.scss` via `@use 'abstracts/animations'`.
- **No cycles.** `_functions.scss` depends on nothing (so `_variables.scss` can
  use `rem()`). Spacing's `space()` lives in `_variables.scss` (next to the
  `$spacing` map it reads), not in `_functions.scss`.
- **Short paths everywhere.** `vite.config` sets a Sass `loadPaths` entry to the
  `styles/` directory, so _any_ file — including a deeply-nested component
  module — can write `@use 'abstracts' as *;` instead of a fragile
  `../../../styles/abstracts` relative path.

---

## 5. Global SCSS vs. CSS Modules

| Use…                        | For…                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| **Global SCSS** (`styles/`) | Design tokens, resets, element defaults, layout scaffolds, utilities |
| **`Component.module.scss`** | Anything specific to a single component, co-located with it          |

- Only **`main.scss`** is imported globally (already wired in `main.tsx`). Never
  import other global partials into a component.
- Component styles are **CSS Modules** (`*.module.scss`). Class names are locally
  scoped and hashed at build time, so `.title` in one component can't collide
  with `.title` in another.
- A component module **references** the design system with `@use 'abstracts' as
*;` but never _redefines_ it.

---

## 6. Styling a component (step by step)

Say you're building `src/renderer/src/components/Panel.tsx`.

**1. Create the co-located module** — `Panel.module.scss`:

```scss
@use 'abstracts' as *;

.panel {
  @include card; // surface + border + radius + shadow
  display: flex;
  flex-direction: column;
  gap: space(4);
}

.title {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.body {
  color: $text-secondary;
  @include line-clamp(3);
}
```

**2. Import and apply** in `Panel.tsx`:

```tsx
import styles from './Panel.module.scss'

export function Panel(): React.JSX.Element {
  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Title</h2>
      <p className={styles.body}>Body text…</p>
    </section>
  )
}
```

**3. Combine with utilities** when it's a one-off, not a component concern:

```tsx
<section className={`${styles.panel} mt-6`}>
```

That's the whole loop. No global registration, no import order to manage.

---

## 7. Using tokens, functions & mixins

Start every module with `@use 'abstracts' as *;`, then reach for:

```scss
.thing {
  // tokens (variables)
  padding: space(6); // spacing scale
  color: $text-primary; // semantic color
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  transition: $transition-base;
  z-index: z(modal);

  // functions
  width: rem(320px); // px → rem
  background: with-alpha($primary, 0.12); // themed alpha via color-mix
  border-color: shade($surface, 0.1); // darken a themed token

  // mixins
  @include flex(column, center, center, space(3));
  @include hover {
    background: $surface-light;
  }
  @include media(lg) {
    padding: space(8);
  }
}
```

See **REFERENCE.md** for the complete signatures and every available token.

---

## 8. Utility classes

Utilities are global, atomic classes for layout and one-off tweaks — used
directly in JSX `className`s, not `@use`d. Prefer them for structural glue;
prefer a component module for anything with meaning or repetition.

```tsx
<div className="flex flex-between items-center gap-4 px-6 py-4">
  <span className="truncate">…</span>
  <button className="pointer no-drag">Action</button>
</div>
```

Spacing utilities (`m-*`, `p-*`, `gap-*`) and `flex`/`grid` helpers are
generated from the same scales as the SCSS tokens, so they never drift. Full
list in REFERENCE.md.

**Rule of thumb:** if you're stacking more than ~3–4 utilities on an element
repeatedly, promote it to a component module class.

---

## 9. The color system & design tokens

**Brand palette** (the only place literal hex is allowed —
`abstracts/_colors.scss`):

| Palette token          | Hex       |
| ---------------------- | --------- |
| `$palette-dark-red`    | `#3A1113` |
| `$palette-red`         | `#5D1B1E` |
| `$palette-dark-gold`   | `#9A6E32` |
| `$palette-gold`        | `#C69953` |
| `$palette-light-cream` | `#EFE7D3` |

Two monotone gray ramps (`$dark-50…900`, `$light-50…900`, darkest→lightest,
R = G = B) provide brand-independent neutrals for surface/border/text steps. See
REFERENCE.md for the full table and recommended semantic mappings. Palette only
— never use in components.

**Semantic tokens** (use _these_ in components): `$primary`, `$primary-dark`,
`$secondary`, `$secondary-dark`, `$background`, `$surface`, `$surface-light`,
`$text-primary`, `$text-secondary`, `$border`, `$divider`, `$success`,
`$warning`, `$error`, `$info`, `$focus-ring`, `$overlay`.

### Adding a new semantic color

1. Add the SCSS pointer in `abstracts/_colors.scss`:
   ```scss
   $accent: var(--color-accent);
   ```
2. Define its value in **every** theme (both files, or the theme falls back to
   nothing):
   ```scss
   // themes/_dark.scss
   --color-accent: #{$palette-gold};
   // themes/_light.scss
   --color-accent: #{$palette-dark-gold};
   ```
3. Use it: `color: $accent;`

---

## 10. Theming

Dark is the **default**, applied directly on `:root`. Light is opt-in via a
`data-theme` attribute. Because every semantic token is a CSS custom property,
switching is instant and requires **no recompilation**:

```ts
// Switch theme at runtime
document.documentElement.dataset.theme = 'light' // or 'dark'
```

```html
<!-- Or set a default in index.html -->
<html data-theme="light"></html>
```

### Adding a whole new theme

1. Copy `themes/_light.scss` to `themes/_sepia.scss`.
2. Redefine the full `--color-*` and `--shadow-*` set under
   `[data-theme='sepia']`.
3. Forward it from `themes/_index.scss`:
   ```scss
   @forward 'sepia';
   ```

Every theme must define the **complete** token set — treat the dark theme as the
contract. Also set `color-scheme` so native form controls / scrollbars match.

---

## 11. Responsive & window resizing

This is a desktop app, so breakpoints adapt to **window resizing**, not a
mobile-first flow. Use the `media()` mixin (min-width, the default direction):

```scss
.grid {
  @include grid(2);
  @include media(lg) {
    @include grid(4);
  }
}
```

The app shell (`layout/_app.scss`) fills the window with a flex column and uses
`min-height: 0` so inner regions scroll rather than overflowing the frame — this
is what keeps things graceful as the user resizes. Available breakpoints: `sm`,
`md`, `lg`, `xl`, `2xl` (see REFERENCE.md for pixel values).

---

## 12. Animations

Global `@keyframes` live in `abstracts/_animations.scss` and are emitted once
from `main.scss`. **Do not** define keyframes inside a component module — CSS
Modules would rename them. Instead, reference the global name:

```scss
.spinner {
  animation: spin $duration-slow linear infinite;
}
.toast {
  animation: slide-up $duration-normal $ease-out;
}
```

Available keyframes: `fade-in`, `fade-out`, `slide-up`, `slide-down`,
`scale-in`, `spin`, `pulse`. Motion tokens (`$duration-*`, `$ease-*`) are in
`abstracts/_variables.scss`. The reset honors `prefers-reduced-motion`
automatically.

---

## 13. Electron / Chromium considerations

- **Single engine.** The renderer is always Chromium, so we use modern CSS
  freely (`color-mix()`, `inset`, `:focus-visible`, logical properties) without
  cross-browser fallbacks or heavy prefixing.
- **Custom scrollbars.** Styled globally with `::-webkit-scrollbar` (plus the
  standard `scrollbar-*` properties). Use the `scrollbar()` mixin for a scoped
  region.
- **Window dragging.** Utilities `.drag` / `.no-drag` map to
  `-webkit-app-region` for custom title bars — mark a bar draggable and opt
  interactive children back out.
- **High-DPI.** Sizing is `rem`/`em`-based and scalable; avoid fixed `px` for
  anything that should respect the root font size. Prefer SVG assets.
- **Desktop-first.** Layouts assume a resizable window, not a phone viewport.

---

## 14. Naming conventions

- **Component module classes:** camelCase, accessed as `styles.myThing`.
- **Global/utility class names:** kebab-case (`.flex-center`, `.mt-4`).
- **Partials:** prefixed with `_`; each folder exposes an `_index.scss` barrel.
- **Modifiers:** BEM-style `--` suffix on globals (`.container--narrow`,
  `.grid--3`).
- **Nesting:** **max 3 levels.** If you're deeper, extract a class or a mixin.

---

## 15. Do's & Don'ts

✅ Use design tokens — `$primary`, `space(4)`, `$radius-md`, `$shadow-md`.
✅ Reuse mixins and utility classes before writing new CSS.
✅ Keep component styles in `*.module.scss`, co-located with the component.
✅ Use `with-alpha()` / `tint()` / `shade()` — they work with themed tokens.
✅ Add a token when a value will be used more than once.
✅ Reference global `@keyframes` by name from components.

❌ Don't hardcode colors, spacing, font sizes, radii, or shadows.
❌ Don't use `!important` (the sole exception is the reduced-motion reset).
❌ Don't duplicate a utility class or token that already exists.
❌ Don't nest more than 3 levels deep.
❌ Don't put `@keyframes` in a module file.
❌ Don't use `@import` — always `@use` / `@forward`.
❌ Don't reference the raw palette (`$palette-*`) in components — use semantic tokens.

---

## 16. Recipes

**A centered, elevated card:**

```scss
@use 'abstracts' as *;

.card {
  @include card(space(8), $radius-xl);
  @include flex(column, center, center, space(4));
  max-width: rem(420px);
}
```

**A glassmorphic overlay bar:**

```scss
.bar {
  @include glass($surface, 24px, 0.6);
  border-radius: $radius-xl;
  padding: space(3) space(5);
}
```

**A hover-reveal action, pointer devices only:**

```scss
.action {
  @include button-base;
  color: $text-primary;
  background: $surface;

  @include hover {
    background: $surface-light;
    border-color: $primary;
  }
}
```

**Truncated, responsive heading:**

```scss
.heading {
  @include truncate;
  font-size: $font-size-2xl;

  @include media(xl) {
    font-size: $font-size-3xl;
  }
}
```

---

## 17. FAQ

**Why `with-alpha()` instead of `rgba()` or `alpha()`?**
`rgba()` can't take a `var()` and split its channels; `alpha()` is a reserved
Sass built-in (it reads a color's alpha). `with-alpha()` uses CSS `color-mix()`,
which works on both static colors and the themed `var()` tokens.

**Can I use SCSS `lighten()`/`darken()` on `$primary`?**
No — those operate on Sass colors, and `$primary` is a `var()`. Use `tint()` /
`shade()` (built on `color-mix`) instead.

**Where do I put a value used by only one component?**
Inline in that component's module. Promote it to a token only when a second
place needs it.

**How do I add a font?**
Load it (e.g. via a `@font-face` in `base/` or a bundled asset), then update the
`$font-sans` / `$font-mono` stacks in `abstracts/_variables.scss`.

**My component needs a color that isn't in the palette.**
If it's a brand/third-party color used purely for a logo, keep it local to the
module with a comment (see `App.module.scss`). If it's a real UI role, add a
semantic token (§9).

**Do abstracts add to my bundle size if I `@use` them everywhere?**
No. Variables, functions, and mixins emit no CSS. Only actual style rules do,
and Sass emits each module's CSS once.

---

## 18. How to add / modify

Every SCSS change slots into one layer. The rule of thumb: **tokens** →
`abstracts/`, **element defaults** → `base/`, **reusable classes** →
`utilities/`/`layout/`, **component styles** → a co-located `*.module.scss`.

### Add a design token

Edit the relevant file in `abstracts/` — it's re-exported via
`abstracts/_index.scss`, so every file that does `@use 'abstracts' as *;` gets it.

```scss
// abstracts/_variables.scss — add to the spacing scale
$spacing: (
  // …existing steps…
  32: rem(128px) // ← new; also generates .m-32 / .p-32 / .gap-32
);
```

For a **color**, follow §9 (palette → semantic pointer → per-theme value). For a
new radius/shadow/duration, add the `$variable` next to its peers.

### Add a mixin or function

```scss
// abstracts/_mixins.scss
@mixin focus-ring($color: $primary) {
  outline: 2px solid $color;
  outline-offset: 2px;
}
```

It's available everywhere via `@use 'abstracts' as *;` — no export step (the
`_index.scss` forwards the whole file). Functions go in `_functions.scss` (keep
them dependency-free to avoid cycles).

### Add a utility class

Add to the matching file in `utilities/` and reference tokens (never literals):

```scss
// utilities/_helpers.scss
.rounded-sm {
  border-radius: $radius-sm;
}
```

Generated families (spacing/gap) come automatically from the `$spacing` map —
add a scale step and the `.m-*`/`.p-*`/`.gap-*` classes appear.

### Add a component style (CSS Module)

Co-locate `Component.module.scss`, start with `@use 'abstracts' as *;`, use
tokens/mixins, import as `styles` (see §6). Never import global partials into a
component.

### How to modify safely

- **Change a token value:** edit it in `abstracts/` once — every consumer updates.
  Theme-specific colors/shadows change in `themes/_dark.scss` + `_light.scss`
  (keep both in sync).
- **Rename a token/mixin:** Sass will error at every call site — fix them in the
  same change.
- **Never** hardcode a hex/px/shadow to "just tweak one spot" — add or reuse a token.
- Update [REFERENCE.md](./REFERENCE.md) tables when you add/rename tokens.

### Common mistakes

- ❌ Raw hex outside `abstracts/_colors.scss` (Stylelint's `color-no-hex` blocks it).
- ❌ Hardcoded spacing/radii/shadows — use `space()`, `$radius-*`, `$shadow-*`.
- ❌ `!important` (only sanctioned in the reduced-motion reset).
- ❌ Nesting deeper than 3 levels.
- ❌ `@keyframes` inside a `*.module.scss` (CSS Modules hash the name) — put them
  in `abstracts/_animations.scss` and reference globally.
- ❌ `@import` — always `@use` / `@forward`.
- ❌ Referencing the raw palette (`$palette-*`) in components — use semantic tokens.
