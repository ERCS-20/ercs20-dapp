export const ProfileRoutes = {
  dashboard: "/profile",
  accounts: "/profile/spot/accounts",
  deposits: "/profile/spot/deposits",
  deposit: "/profile/spot/deposit",
  withdrawals: "/profile/spot/withdrawals",
  withdraw: "/profile/spot/withdraw",
  perpsAccounts: "/profile/perps/accounts",
  perpsDeposits: "/profile/perps/deposits",
  perpsDeposit: "/profile/perps/deposit",
  perpsWithdraw: "/profile/perps/withdraw",
  perpsWithdrawals: "/profile/perps/withdrawals",
  applyList: "/profile/apply-list",
  applyListPerps: "/profile/apply-list-perps",
  deployErcs20: "/profile/deploy-ercs-20",
  accountDetail: (tokenAddress: string) =>
    `/profile/spot/accounts/${encodeURIComponent(tokenAddress)}`,
  perpsAccountDetail: (tokenAddress: string) =>
    `/profile/perps/accounts/${encodeURIComponent(tokenAddress)}`,
} as const;

export type ProfileSection =
  | "dashboard"
  | "spot-accounts"
  | "spot-deposits"
  | "spot-withdrawals"
  | "perps-accounts"
  | "perps-deposits"
  | "perps-withdrawals";

const legacySectionPaths: Record<string, string> = {
  "spot-accounts": ProfileRoutes.accounts,
  "spot-deposits": ProfileRoutes.deposits,
  "spot-withdrawals": ProfileRoutes.withdrawals,
  "perps-accounts": ProfileRoutes.perpsAccounts,
  "perps-deposits": ProfileRoutes.perpsDeposits,
  "perps-withdrawals": ProfileRoutes.perpsWithdrawals,
};

export function legacySectionToPath(section: string | null): string | null {
  if (!section) return null;
  return legacySectionPaths[section] ?? null;
}

export function pathnameToProfileSection(pathname: string): ProfileSection {
  if (pathname.startsWith(ProfileRoutes.perpsAccounts)) return "perps-accounts";
  if (pathname === ProfileRoutes.perpsDeposits) return "perps-deposits";
  if (pathname === ProfileRoutes.perpsWithdrawals) return "perps-withdrawals";
  if (pathname.startsWith(ProfileRoutes.accounts)) return "spot-accounts";
  if (pathname === ProfileRoutes.deposits) return "spot-deposits";
  if (pathname === ProfileRoutes.withdrawals) return "spot-withdrawals";
  return "dashboard";
}
