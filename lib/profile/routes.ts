export const ProfileRoutes = {
  dashboard: "/profile",
  accounts: "/profile/accounts",
  deposits: "/profile/deposits",
  deposit: "/profile/deposit",
  perpsAccounts: "/profile/perps/accounts",
  perpsDeposits: "/profile/perps/deposits",
  perpsDeposit: "/profile/perps/deposit",
  applyList: "/profile/apply-list",
  deployErcs20: "/profile/deploy-ercs-20",
  withdrawals: "/profile/withdrawals",
  withdraw: "/profile/withdraw",
  accountDetail: (tokenAddress: string) =>
    `/profile/accounts/${encodeURIComponent(tokenAddress)}`,
  perpsAccountDetail: (tokenAddress: string) =>
    `/profile/perps/accounts/${encodeURIComponent(tokenAddress)}`,
} as const;

export type ProfileSection =
  | "dashboard"
  | "spot-accounts"
  | "spot-deposits"
  | "spot-withdrawals"
  | "perps-accounts"
  | "perps-deposits";

const legacySectionPaths: Record<string, string> = {
  "spot-accounts": ProfileRoutes.accounts,
  "spot-deposits": ProfileRoutes.deposits,
  "spot-withdrawals": ProfileRoutes.withdrawals,
  "perps-accounts": ProfileRoutes.perpsAccounts,
  "perps-deposits": ProfileRoutes.perpsDeposits,
};

export function legacySectionToPath(section: string | null): string | null {
  if (!section) return null;
  return legacySectionPaths[section] ?? null;
}

export function pathnameToProfileSection(pathname: string): ProfileSection {
  if (pathname.startsWith("/profile/perps/accounts")) return "perps-accounts";
  if (pathname === ProfileRoutes.perpsDeposits) return "perps-deposits";
  if (pathname.startsWith("/profile/accounts")) return "spot-accounts";
  if (pathname === ProfileRoutes.deposits) return "spot-deposits";
  if (pathname === ProfileRoutes.withdrawals) return "spot-withdrawals";
  return "dashboard";
}
