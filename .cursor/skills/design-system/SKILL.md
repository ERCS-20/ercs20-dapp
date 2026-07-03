---
name: design-system
description: Entry point for exchange UI design—philosophy, hierarchy, spacing, and skill index. Use before building or polishing any UI; defers hard constraints to .cursor/rules/ui.mdc.
---

# Design System

Senior product designer + frontend engineer. Interfaces must look **production-ready**, not admin templates.

## Philosophy

Clean, professional, premium, fast, modern, minimal, consistent. **Information over decoration.**

Inspiration (do not copy): Binance, Coinbase, Bybit, OKX, Stripe/Vercel/Linear dashboards.

## Hard Constraints

Rules override this skill: `ui.mdc`, `frontend.mdc`, `project.mdc`.

Orbix brand: `app/globals.css` — teal (light) / pink (dark) primary.

## Before Coding

1. Primary information? 2. Visual priority? 3. Secondary info? 4. Simpler layout? 5. Whitespace? 6. Reusable components?

Do not jump straight to JSX.

## Layout

Desktop-first: **Header → Toolbar → Main → Panels → Footer?** Multiple sections, not one mega-Card.

## Quick Tokens

- Spacing: 4–64 scale (`ui.mdc`)
- Cards: subtle border, light shadow, `rounded-xl`–`2xl`
- Buttons: one primary per section
- Empty states: loading, error, empty, denied, offline, success

## Skill Index

| Need | Skill |
|------|-------|
| Palette | `colors` |
| Type | `typography` |
| Dark | `dark-mode` |
| Motion | `animation` |
| a11y | `accessibility` |
| Breakpoints | `responsive`, `mobile` |
| Forms | `forms`, `create-form` |
| Data | `tables`, `orderbook`, `charts` |
| Pages | `dashboard`, `trading-page`, `wallet`, `authentication` |
| New route | `create-page` |
| Chain feature | `create-web3-feature` |
| PR | `review-pr` |

## Self-Review

- [ ] Balanced layout, consistent spacing, minimal decoration
- [ ] Simplifiable? Premium fintech quality?
- [ ] Acceptable on a production exchange?
