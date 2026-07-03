---
name: trading-page
description: Spot/derivatives trading grid—chart, book, form, orders, balances.
---

# Trading Page

Priority: Chart → Order book → History → Order form → Open orders → Balances.

Desktop grid; form reachable without scroll. Isolate fast-updating subtrees (no page-level rerender on tick).

Mobile: `@mobile` skill — tabs, not 4-column squeeze.

Related: `orderbook`, `charts`, `forms`, `tables`, `wallet`.

Current repo Phase 1 reference: `swap-card.tsx` (single-pair swap, not full terminal yet).
