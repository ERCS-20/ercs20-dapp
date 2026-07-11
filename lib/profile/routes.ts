export const ProfileRoutes = {
  dashboard: "/profile",
  accounts: "/profile/accounts",
  deposits: "/profile/deposits",
  deposit: "/profile/deposit",
  applyList: "/profile/apply-list",
  withdrawals: "/profile/withdrawals",
  withdraw: "/profile/withdraw",
  accountDetail: (tokenAddress: string) =>
    `/profile/accounts/${encodeURIComponent(tokenAddress)}`,
} as const;

export type ProfileSection =
  | "dashboard"
  | "spot-accounts"
  | "spot-deposits"
  | "spot-withdrawals";

const legacySectionPaths: Record<string, string> = {
  "spot-accounts": ProfileRoutes.accounts,
  "spot-deposits": ProfileRoutes.deposits,
  "spot-withdrawals": ProfileRoutes.withdrawals,
};

export function legacySectionToPath(section: string | null): string | null {
  if (!section) return null;
  return legacySectionPaths[section] ?? null;
}

export function pathnameToProfileSection(pathname: string): ProfileSection {
  if (pathname.startsWith("/profile/accounts")) return "spot-accounts";
  if (pathname === ProfileRoutes.deposits) return "spot-deposits";
  if (pathname === ProfileRoutes.withdrawals) return "spot-withdrawals";
  return "dashboard";
}
