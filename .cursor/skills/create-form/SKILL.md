---
name: create-form
description: Builds shadcn forms with i18n, validation, and Orbix styling. Use for deploy, swap settings, or settings sheets.
---

# Create Form

## Read First

`frontend.mdc` · `ui.mdc` · `forms` skill

References: `factory-create-card.tsx`, `swap-settings-sheet.tsx`, `swap-card.tsx`

## Checklist

- [ ] shadcn Input, Label, Button, Sheet/Dialog
- [ ] Vertical layout; label + input + helper + error (`role="alert"`)
- [ ] i18n keys in three locales
- [ ] `h-12 rounded-2xl` fields (deploy pattern)
- [ ] Submit disabled while invalid/pending; sonner feedback
- [ ] Wallet/chain gate before on-chain submit (`wallet` skill)

## Decimals

Reuse `sanitizeDecimal18` / `parsePositiveDecimal18` patterns from `factory-create-card.tsx`.

## shadcn

```bash
npx shadcn@latest add input label
```

User runs install locally.

Chain submit: use `create-web3-feature` skill.
