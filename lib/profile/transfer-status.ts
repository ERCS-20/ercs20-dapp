import type { DepositStatus, WithdrawalStatus } from "@/services/asset/types";

export function depositStatusLabel(t: (k: string) => string, status: DepositStatus): string {
  switch (status) {
    case "Pending":
      return t("profile.depositStatusPending");
    case "Success":
      return t("profile.depositStatusSuccess");
    default:
      return status;
  }
}

export function depositStatusBadgeClass(status: DepositStatus): string {
  switch (status) {
    case "Pending":
      return "border-muted-foreground/40 text-muted-foreground";
    case "Success":
      return "border-brand text-brand";
    default:
      return "border-border text-foreground";
  }
}

export function withdrawalStatusLabel(t: (k: string) => string, status: WithdrawalStatus): string {
  switch (status) {
    case "AwaitingClaim":
      return t("profile.withdrawalStatusAwaitingClaim");
    case "Success":
      return t("profile.withdrawalStatusSuccess");
    default:
      return status;
  }
}

export function withdrawalStatusBadgeClass(status: WithdrawalStatus): string {
  switch (status) {
    case "AwaitingClaim":
      return "border-brand-alt text-brand-alt";
    case "Success":
      return "border-brand text-brand";
    default:
      return "border-border text-foreground";
  }
}
