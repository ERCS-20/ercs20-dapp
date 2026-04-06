This is a [Next.js](https://nextjs.org) project bootstrapped with [`ercs20-dapp`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project structure

High-level layout for the App Router frontend and future Web3 (ERCS-20) integration:

```text
ercs20-dapp/
├── app/                    # Routes, layouts, and global styles
│   ├── (app)/              # Authenticated / wallet-focused app shell
│   │   └── dashboard/      # e.g. /dashboard
│   ├── (marketing)/        # Optional landing or docs routes (group only)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/                 # shadcn / Radix primitives
├── hooks/                  # Client hooks (e.g. wallet state)
├── lib/
│   ├── utils.ts            # Shared helpers (e.g. cn)
│   ├── web3/               # Chain IDs, RPC config
│   └── contracts/          # Contract ABIs
├── providers/              # Top-level React providers (e.g. Web3)
├── public/                 # Static assets
└── types/                  # Shared TypeScript types
```

- **`app/`** — URL-facing files only; keep heavy UI in `components/`.
- **`components/ui/`** — Design-system components; keep feature UI one level up or in co-located modules.
- **`lib/web3` & `lib/contracts`** — RPC URLs, chain constants, and ABIs (deployed factory / default token use `NEXT_PUBLIC_*` env and token list JSON).
- **`hooks/` & `providers/`** — Client wallet/chain state and context; `Web3Provider` wraps the tree in `app/layout.tsx`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
