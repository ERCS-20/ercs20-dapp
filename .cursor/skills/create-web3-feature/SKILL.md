---
name: create-web3-feature
description: Implements wallet-connected ERCS-20 features with viem/wagmi. Use for swap, deploy, reads, or new contract interactions.
---

# Create Web3 Feature

## Read First

`web3.mdc` · `security.mdc` · `.env.example`

References: `swap-card.tsx`, `factory-create-card.tsx`

## Checklist

- [ ] ABI in `lib/contracts/`; addresses from env (`lib/config/`)
- [ ] Chain matches `supportedChains` / `NEXT_PUBLIC_CHAIN_ID`
- [ ] Connect → read → write → receipt → toast
- [ ] Wrong network + `isSwapEnvConfigured()` fallback
- [ ] Minimal diff; no new wallet SDKs

## Patterns

```tsx
useReadContract({ address, abi, functionName, args, query: { enabled } });
useWriteContract() + useWaitForTransactionReceipt({ hash });
```

Amounts: `parseUnits` / `formatUnits`. Slippage: `lib/swap/min-out.ts`.

ERCS-20: prefer `buy`/`sell`, not approve-first flows.

## Deliver

List required env vars; if `package.json` changes, give user `npm install` command.
