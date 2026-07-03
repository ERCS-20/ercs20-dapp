---
name: colors
description: Orbix and exchange semantic colors—roles, states, dark pairing. Use when styling states, charts, or order book; ui.mdc overrides generic palettes.
---

# Colors

## Orbix (this repo)

| Token | Light | Dark |
|-------|-------|------|
| Primary | teal `#00d1b2` → `bg-primary` | pink `#f06292` |
| Text | `text-foreground` / `text-muted-foreground` | same tokens |
| Border | `border-border` | translucent oklch |
| Destructive | `destructive` | for errors / sell emphasis |

Define changes in `app/globals.css`, not TSX hex.

## Exchange Semantics

| Role | Use |
|------|-----|
| Success | Buy filled, deposit, positive PnL |
| Danger | Sell, withdraw, errors |
| Warning | Pending, risk |
| Neutral | chrome, borders, secondary text |

One accent per screen. Pair color with label/icon (`accessibility` skill).

## Never

- Hardcode hex in components
- Rainbow dashboards or gradient data tables
- Light-mode teal forced as dark primary CTA

See `dark-mode` skill for elevation.
