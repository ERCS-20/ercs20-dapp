---
name: typography
description: Fintech type hierarchy and numeric formatting for exchange UI.
---

# Typography

Hierarchy: **Page title → Section → Body → Caption** (≤4 sizes per screen).

Numbers: `tabular-nums`; right-align columns; mono for dense IDs/prices (`tables`, `orderbook`).

Project fonts: Geist + Noto SC/TC via `app/layout.tsx` — no random Google Font pairs.

Never: bold everything; unreadable micro type on mobile.
