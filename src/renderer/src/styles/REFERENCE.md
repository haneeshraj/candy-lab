# Styling Reference

Complete catalog of everything the styling system exposes — colors, variables,
functions, mixins, keyframes, utility classes, and CSS custom properties. For
concepts and workflow, see **[GUIDE.md](./GUIDE.md)**.

All SCSS members below are available in any file after:

```scss
@use 'abstracts' as *;
```

The document root is `62.5%`, so **1rem = 10px** and `rem()` returns px ÷ 10.
`space()` steps come from the `$spacing` map.

---

## Table of contents

- [Colors](#colors)
  - [Raw palette](#raw-palette)
  - [Semantic tokens](#semantic-tokens)
  - [Theme values](#theme-values)
- [Typography](#typography)
- [Spacing scale](#spacing-scale)
- [Border radius](#border-radius)
- [Shadows / elevation](#shadows--elevation)
- [Opacity](#opacity)
- [Motion](#motion)
- [Layout & sizing](#layout--sizing)
- [Breakpoints](#breakpoints)
- [Z-index layers](#z-index-layers)
- [Functions](#functions)
- [Mixins](#mixins)
- [Keyframes](#keyframes)
- [Utility classes](#utility-classes)
- [Layout classes](#layout-classes)
- [CSS custom properties](#css-custom-properties)

---

## Colors

Defined in `abstracts/_colors.scss`.

### Raw palette

> The **only** place literal hex is allowed. Do not reference these in
> components — use semantic tokens.

| SCSS variable          | Hex       |
| ---------------------- | --------- |
| `$palette-dark-red`    | `#3A1113` |
| `$palette-red`         | `#5D1B1E` |
| `$palette-dark-gold`   | `#9A6E32` |
| `$palette-gold`        | `#C69953` |
| `$palette-light-cream` | `#EFE7D3` |
| `$palette-success`     | `#3E8E5A` |
| `$palette-warning`     | `#D9A441` |
| `$palette-error`       | `#B23A3A` |
| `$palette-info`        | `#4A6D8C` |
| `$palette-ink`         | `#160A0B` |
| `$palette-ink-soft`    | `#21100F` |
| `$palette-ink-mute`    | `#2C1817` |

### Semantic tokens

Each resolves to a CSS custom property (`$primary` → `var(--color-primary)`).

| SCSS token        | CSS custom property      | Role                      |
| ----------------- | ------------------------ | ------------------------- |
| `$primary`        | `--color-primary`        | Primary brand / actions   |
| `$primary-dark`   | `--color-primary-dark`   | Primary hover / pressed   |
| `$secondary`      | `--color-secondary`      | Secondary brand           |
| `$secondary-dark` | `--color-secondary-dark` | Secondary hover / pressed |
| `$background`     | `--color-background`     | App/window background     |
| `$surface`        | `--color-surface`        | Cards, panels, inputs     |
| `$surface-light`  | `--color-surface-light`  | Raised/hover surface      |
| `$text-primary`   | `--color-text-primary`   | Body & heading text       |
| `$text-secondary` | `--color-text-secondary` | Muted / secondary text    |
| `$border`         | `--color-border`         | Component borders         |
| `$divider`        | `--color-divider`        | Hairline separators       |
| `$success`        | `--color-success`        | Success state             |
| `$warning`        | `--color-warning`        | Warning state             |
| `$error`          | `--color-error`          | Error / destructive state |
| `$info`           | `--color-info`           | Informational state       |
| `$focus-ring`     | `--color-focus-ring`     | Keyboard focus outline    |
| `$overlay`        | `--color-overlay`        | Modal / scrim backdrop    |

### Theme values

Resolved per theme (`themes/_dark.scss`, `themes/_light.scss`).

| Token                    | Dark (default)    | Light                 |
| ------------------------ | ----------------- | --------------------- |
| `--color-primary`        | `#C69953`         | `#9A6E32`             |
| `--color-primary-dark`   | `#9A6E32`         | `#C69953`             |
| `--color-secondary`      | `#5D1B1E`         | `#5D1B1E`             |
| `--color-secondary-dark` | `#3A1113`         | `#3A1113`             |
| `--color-background`     | `#160A0B`         | `#EFE7D3`             |
| `--color-surface`        | `#21100F`         | cream +4% lightness   |
| `--color-surface-light`  | `#2C1817`         | `#FFFFFF`             |
| `--color-text-primary`   | `#EFE7D3`         | `#3A1113`             |
| `--color-text-secondary` | cream @ 64% alpha | dark-red @ 70% alpha  |
| `--color-border`         | cream @ 12% alpha | dark-red @ 14% alpha  |
| `--color-divider`        | cream @ 8% alpha  | dark-red @ 8% alpha   |
| `--color-focus-ring`     | gold @ 60% alpha  | dark-gold @ 60% alpha |
| `--color-overlay`        | ink @ 60% alpha   | dark-red @ 40% alpha  |
| `color-scheme`           | `dark`            | `light`               |

Status colors (`success`/`warning`/`error`/`info`) are identical across themes.

---

## Typography

Defined in `abstracts/_variables.scss`.

**Font stacks**

| Variable            | Value                              |
| ------------------- | ---------------------------------- |
| `$font-sans`        | Inter → system UI sans stack       |
| `$font-mono`        | JetBrains Mono → system mono stack |
| `$font-family-base` | `$font-sans`                       |
| `$font-family-mono` | `$font-mono`                       |

**Font sizes** (`$font-size-root` = `62.5%` → **1rem = 10px**)

| Variable         | px  | rem    |
| ---------------- | --- | ------ |
| `$font-size-xs`  | 12  | 1.2rem |
| `$font-size-sm`  | 14  | 1.4rem |
| `$font-size-md`  | 16  | 1.6rem |
| `$font-size-lg`  | 18  | 1.8rem |
| `$font-size-xl`  | 20  | 2rem   |
| `$font-size-2xl` | 24  | 2.4rem |
| `$font-size-3xl` | 30  | 3rem   |
| `$font-size-4xl` | 36  | 3.6rem |

**Font weights:** `$font-weight-light` 300 · `-regular` 400 · `-medium` 500 ·
`-semibold` 600 · `-bold` 700

**Line heights:** `$line-height-tight` 1.2 · `-snug` 1.4 · `-normal` 1.6 ·
`-relaxed` 1.8

**Letter spacing:** `$letter-spacing-tight` −0.01em · `-normal` 0 · `-wide`
0.02em · `-wider` 0.06em

> The root is `62.5%` (10px) so `1rem = 10px` — clean px↔rem math. The `rem()`
> helper divides by this same 10px base, so tokens stay pixel-accurate.

---

## Spacing scale

`$spacing` map in `abstracts/_variables.scss`. Access with `space($step)`.
Powers the `m-*`/`p-*`/`gap-*` utilities.

| Step | px  | rem    |     | Step | px  | rem    |
| ---- | --- | ------ | --- | ---- | --- | ------ |
| `0`  | 0   | 0      |     | `6`  | 24  | 2.4rem |
| `1`  | 4   | 0.4rem |     | `8`  | 32  | 3.2rem |
| `2`  | 8   | 0.8rem |     | `10` | 40  | 4rem   |
| `3`  | 12  | 1.2rem |     | `12` | 48  | 4.8rem |
| `4`  | 16  | 1.6rem |     | `16` | 64  | 6.4rem |
| `5`  | 20  | 2rem   |     | `20` | 80  | 8rem   |
|      |     |        |     | `24` | 96  | 9.6rem |

---

## Border radius

| Variable         | Value  | px   |
| ---------------- | ------ | ---- |
| `$radius-sm`     | 0.4rem | 4px  |
| `$radius-md`     | 0.8rem | 8px  |
| `$radius-lg`     | 1.2rem | 12px |
| `$radius-xl`     | 2rem   | 20px |
| `$radius-pill`   | 9999px | —    |
| `$radius-circle` | 50%    | —    |

---

## Shadows / elevation

Themeable — the SCSS variables point at CSS custom properties.

| SCSS         | CSS var       | Dark value                    | Light value                      |
| ------------ | ------------- | ----------------------------- | -------------------------------- |
| `$shadow-sm` | `--shadow-sm` | `0 1px 2px rgba(0,0,0,.4)`    | `0 1px 2px rgba(58,17,19,.10)`   |
| `$shadow-md` | `--shadow-md` | `0 4px 12px rgba(0,0,0,.45)`  | `0 4px 12px rgba(58,17,19,.12)`  |
| `$shadow-lg` | `--shadow-lg` | `0 12px 32px rgba(0,0,0,.5)`  | `0 12px 32px rgba(58,17,19,.16)` |
| `$shadow-xl` | `--shadow-xl` | `0 24px 64px rgba(0,0,0,.55)` | `0 24px 64px rgba(58,17,19,.20)` |

Apply directly (`box-shadow: $shadow-md;`) or via `@include elevation(md)`.

---

## Opacity

| Variable            | Value |
| ------------------- | ----- |
| `$opacity-disabled` | 0.5   |
| `$opacity-muted`    | 0.7   |
| `$opacity-hover`    | 0.85  |

---

## Motion

**Durations:** `$duration-fast` 120ms · `$duration-normal` 220ms ·
`$duration-slow` 360ms

**Easings**

| Variable         | Cubic-bezier            |
| ---------------- | ----------------------- |
| `$ease-standard` | `(0.4, 0, 0.2, 1)`      |
| `$ease-in`       | `(0.4, 0, 1, 1)`        |
| `$ease-out`      | `(0, 0, 0.2, 1)`        |
| `$ease-spring`   | `(0.34, 1.56, 0.64, 1)` |

**Composed transitions**

| Variable             | Value                                                   |
| -------------------- | ------------------------------------------------------- |
| `$transition-base`   | `all 220ms $ease-standard`                              |
| `$transition-colors` | color + background-color + border-color, 120ms standard |

---

## Layout & sizing

| Variable                | Value         | Use                          |
| ----------------------- | ------------- | ---------------------------- |
| `$layout-max-width`     | 1280px        | Widest content container     |
| `$layout-content-width` | 960px         | Reading-width container      |
| `$layout-narrow-width`  | 640px         | Narrow / form container      |
| `$titlebar-height`      | 2rem (20px)   | Custom title bar height      |
| `$control-height`       | 3.8rem (38px) | Default button/input height  |
| `$control-height-sm`    | 3rem (30px)   | Small control                |
| `$control-height-lg`    | 4.6rem (46px) | Large control                |
| `$border-width`         | 1px           | Standard border              |
| `$border-width-thick`   | 2px           | Focus ring / emphasis border |

---

## Breakpoints

`$breakpoints` map in `abstracts/_breakpoints.scss`. Use via `media()` /
`media-max()`.

| Name  | Min-width |
| ----- | --------- |
| `sm`  | 640px     |
| `md`  | 768px     |
| `lg`  | 1024px    |
| `xl`  | 1280px    |
| `2xl` | 1536px    |

---

## Z-index layers

`$z-layers` map in `abstracts/_z-index.scss`. Use via `z($layer)`.

| Layer      | Value |     | Layer      | Value |
| ---------- | ----- | --- | ---------- | ----- |
| `base`     | 0     |     | `popover`  | 1400  |
| `dropdown` | 1000  |     | `toast`    | 1500  |
| `sticky`   | 1100  |     | `tooltip`  | 1600  |
| `overlay`  | 1200  |     | `titlebar` | 1700  |
| `modal`    | 1300  |     |            |       |

---

## Functions

| Signature                     | Returns / notes                                                       |
| ----------------------------- | --------------------------------------------------------------------- |
| `rem($px, $base: 10px)`       | px → `rem`. Accepts unitless or `px`. `rem(24px)` → `2.4rem`.         |
| `em($px, $base: 10px)`        | px → `em`.                                                            |
| `with-alpha($color, $amount)` | Color at `$amount` (0–1) opacity via `color-mix`. Works with `var()`. |
| `tint($color, $amount)`       | Mix toward white by `$amount` (0–1). Works with `var()`.              |
| `shade($color, $amount)`      | Mix toward black by `$amount` (0–1). Works with `var()`.              |
| `space($step)`                | Value from the `$spacing` map. Errors on unknown step.                |
| `z($layer)`                   | Value from the `$z-layers` map. Errors on unknown layer.              |

```scss
padding: space(4); //  1.6rem  (16px)
width: rem(320px); //  32rem   (320px)
background: with-alpha(
  $primary,
  0.15
); //  color-mix(in srgb, var(--color-primary) 15%, transparent)
border-color: shade($surface, 0.1);
z-index: z(modal); //  1300
```

---

## Mixins

| Signature                                                               | Purpose                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------- |
| `flex($direction: row, $justify: flex-start, $align: stretch, $gap: 0)` | Flex container shorthand.                          |
| `flex-center`                                                           | `display:flex` centered both axes.                 |
| `flex-between`                                                          | Space-between, centered cross-axis.                |
| `grid($columns: 12, $gap: space(4))`                                    | CSS grid with N equal columns.                     |
| `absolute-center`                                                       | Absolute, translate(-50%, -50%).                   |
| `absolute-fill`                                                         | Absolute, `inset: 0`.                              |
| `size($width, $height: $width)`                                         | Width + height (square by default).                |
| `truncate`                                                              | Single-line ellipsis.                              |
| `line-clamp($lines: 2)`                                                 | Multi-line ellipsis.                               |
| `hover { … }`                                                           | `:hover` gated to real pointers (`@content`).      |
| `focus-ring($color: $focus-ring)`                                       | Outline focus ring.                                |
| `elevation($level: md)`                                                 | `box-shadow` by level (`sm`/`md`/`lg`/`xl`).       |
| `card($padding: space(6), $radius: $radius-lg)`                         | Surface + border + radius + shadow.                |
| `glass($background: $surface, $blur: 12px, $opacity: 0.6)`              | Translucent blurred surface.                       |
| `button-base`                                                           | Baseline button box, sizing, transition, disabled. |
| `scrollbar($size: 10px, $thumb: $surface-light, $track: transparent)`   | Scoped custom scrollbar.                           |
| `media($name) { … }`                                                    | Min-width media query by breakpoint name.          |
| `media-max($name) { … }`                                                | Max-width media query by breakpoint name.          |

---

## Keyframes

Global (defined in `abstracts/_animations.scss`, emitted once via `main.scss`).
Reference by name; never redefine inside a module.

`fade-in` · `fade-out` · `slide-up` · `slide-down` · `scale-in` · `spin` ·
`pulse`

```scss
animation: slide-up $duration-normal $ease-out;
animation: spin $duration-slow linear infinite;
```

---

## Utility classes

Global atomic classes for use in JSX `className`s.

**Display** — `.block` · `.inline-block` · `.inline` · `.contents`

**Flex** — `.flex` · `.inline-flex` · `.flex-col` · `.flex-row` · `.flex-wrap` ·
`.flex-1` · `.flex-center` · `.flex-between` · `.items-center` · `.items-start` ·
`.items-end` · `.justify-center` · `.justify-between`

**Gap** — `.gap-{step}` for every spacing step
(`0,1,2,3,4,5,6,8,10,12,16,20,24`)

**Margin & padding** — generated for every spacing step:

- All sides: `.m-{step}` · `.p-{step}`
- Axis: `.mx-{step}` · `.my-{step}` · `.px-{step}` · `.py-{step}`
- Single side: `.mt-` `.mr-` `.mb-` `.ml-` and `.pt-` `.pr-` `.pb-` `.pl-`
  (each `+ {step}`)

**Visibility & interaction** — `.hidden` · `.invisible` · `.visible` ·
`.overflow-hidden` · `.overflow-auto` · `.select-none` · `.select-text` ·
`.pointer` · `.not-allowed` · `.sr-only`

**Sizing** — `.w-full` · `.h-full` · `.full` · `.min-w-0` · `.min-h-0`

**Text** — `.text-center` · `.text-left` · `.text-right` · `.text-muted` ·
`.truncate`

**Radius** — `.rounded` · `.rounded-lg` · `.rounded-full`

**Elevation** — `.shadow-sm` · `.shadow` · `.shadow-lg`

**Electron window dragging** — `.drag` · `.no-drag` (`-webkit-app-region`)

---

## Layout classes

Structural classes from the `layout/` layer (global).

**App shell** — `.app-shell` (full-height flex column) · `.app-body`
(scrollable fill region)

**Containers** — `.container` · `.container--content` (960px) ·
`.container--narrow` (640px)

**Grid** — `.grid` (12-col) · `.grid--2` · `.grid--3` · `.grid--4` ·
`.grid--auto` (auto-fill, min 240px)

**Flow** — `.stack` (vertical rhythm) · `.stack--sm` · `.stack--lg` ·
`.cluster` (wrapping horizontal group) · `.section` (block padding)

---

## CSS custom properties

Set per theme on `:root` / `[data-theme]`. Prefer the SCSS token that points at
each; reference the raw property directly only when SCSS can't reach it (e.g.
inline styles from JS).

**Colors** — `--color-primary` · `--color-primary-dark` · `--color-secondary` ·
`--color-secondary-dark` · `--color-background` · `--color-surface` ·
`--color-surface-light` · `--color-text-primary` · `--color-text-secondary` ·
`--color-border` · `--color-divider` · `--color-success` · `--color-warning` ·
`--color-error` · `--color-info` · `--color-focus-ring` · `--color-overlay`

**Shadows** — `--shadow-sm` · `--shadow-md` · `--shadow-lg` · `--shadow-xl`

**Also set per theme:** `color-scheme` (`dark` / `light`).
