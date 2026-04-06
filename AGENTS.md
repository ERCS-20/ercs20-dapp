<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-agent-rules -->
# Shared UI (shadcn)

- Add primitives with the project **shadcn** CLI (`npx shadcn@latest add <component>`). Do **not** hand-roll new files under `components/ui/` that duplicate shadcn blocks (Dialog, Sheet, Button, etc.).
- If stock shadcn is not enough, **extend in feature code** (`components/<feature>/…`) via `className`, composition, or small wrappers—only fall back to a custom `components/ui/*` when there is no shadcn equivalent.
<!-- END:ui-agent-rules -->

