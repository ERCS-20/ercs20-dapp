---
name: review-pr
description: Reviews changes for security, Web3 correctness, ui.mdc consistency, and i18n. Use when user asks for PR or code review.
---

# Review PR

## Rules Map

| Change | Check |
|--------|-------|
| Any | `project.mdc`, `security.mdc`, `code-style.mdc` |
| UI | `frontend.mdc`, `ui.mdc`, `@design-system` |
| Chain | `web3.mdc` |
| API | `api.mdc` |

## Checklist

**General:** focused diff, types, no secrets in commit

**Security:** no shady deps, no keys in client, reviewable contract diffs

**Web3:** env addresses, receipt wait, wrong-network UX, bigint not float

**Frontend:** shadcn not duplicates, 3-locale i18n, dark mode, aria

**UI:** semantic tokens, Orbix patterns, no random hex

## Feedback

- 🔴 Must fix — security, correctness
- 🟡 Suggest — consistency, edge cases
- 🟢 Optional — polish

Include file + one-line fix suggestion.

## Output

Summary (1–3 sentences) · Critical · Suggestions · Test plan checklist

Do not force-push or amend unless user asks.
