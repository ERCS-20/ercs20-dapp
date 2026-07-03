---
name: wallet
description: Connect, network gate, balances—wagmi/RainbowKit patterns for this repo.
---

# Wallet

Connect CTA when disconnected; address dropdown when connected.

Wrong network: `wrong-network-gate.tsx`. Header: `connect-wallet-button.tsx`, `app-header.tsx`.

Balances: formatted + symbol; explicit connect prompt on forms, not silent disabled submit.

Never seed phrase in UI. ERCS-20 swap uses buy/sell (`web3.mdc`).

References: `hooks/use-wallet.ts`, `use-token-balance.ts`.
