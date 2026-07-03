---
name: animation
description: Subtle 150–250ms motion; avoid animating hot trading paths.
---

# Animation

Prefer opacity/transform; duration **150–250ms**. Respect `prefers-reduced-motion`.

Do not animate order book/chart on every tick without throttle.

Skeleton > full-page spinner for known layouts.

See `trading-page` skill for perf.
