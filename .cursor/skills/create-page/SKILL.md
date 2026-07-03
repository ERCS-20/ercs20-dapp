---
name: create-page
description: Adds a Next.js App Router page for ERCS-20 dApp with i18n, SiteLayout, and ui.mdc widths. Use for new routes or Phase 2 placeholders.
---

# Create Page

## Read First

`project.mdc` · `frontend.mdc` · `ui.mdc` · `@design-system`

## Checklist

- [ ] `app/<route>/page.tsx` + `metadata`
- [ ] UI in `components/<feature>/`
- [ ] i18n: en / zh-CN / zh-TW
- [ ] Nav link in `app-header.tsx` if needed
- [ ] Mobile + dark mode
- [ ] No duplicate AppProviders/SiteLayout

## Width

| Type | Class | Reference |
|------|-------|-----------|
| Swap/form | `max-w-[480px] px-4 py-8 sm:py-12` | `swap-card.tsx` |
| Marketing | `max-w-6xl px-6 sm:px-8` | `home-view.tsx` |
| Phase 2 | `max-w-2xl` + roadmap card | `roadmap-placeholder.tsx` |

## Template

```tsx
import type { Metadata } from "next";
import { FeatureView } from "@/components/<feature>/<feature>-view";

export const metadata: Metadata = {
  title: "… · ERCS-20",
  description: "…",
};

export default function Page() {
  return <FeatureView />;
}
```

Domain skills: `dashboard`, `trading-page`, `forms` as needed.
