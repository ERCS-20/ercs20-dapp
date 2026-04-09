"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getSwapTargetChain,
  getSwapTargetChainId,
  isSwapEnvConfigured,
} from "@/lib/config/swap-target";
import { useI18n } from "@/providers/i18n-provider";

type WrongNetworkGateContextValue = {
  reopenWrongNetwork: () => void;
};

const WrongNetworkGateContext =
  createContext<WrongNetworkGateContextValue | null>(null);

export function useWrongNetworkGate(): WrongNetworkGateContextValue {
  const ctx = useContext(WrongNetworkGateContext);
  if (ctx == null) {
    throw new Error("useWrongNetworkGate requires WrongNetworkGateProvider");
  }
  return ctx;
}

export function WrongNetworkGateProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const targetChainId = getSwapTargetChainId();
  const targetChain = getSwapTargetChain();
  const configured = isSwapEnvConfigured();

  const wrongNetwork = useMemo(
    () =>
      configured &&
      isConnected &&
      targetChainId != null &&
      chainId !== targetChainId,
    [configured, isConnected, targetChainId, chainId]
  );

  const [closedWhileWrong, setClosedWhileWrong] = useState(false);

  useEffect(() => {
    if (!wrongNetwork) setClosedWhileWrong(false);
  }, [wrongNetwork]);

  const open = wrongNetwork && !closedWhileWrong;

  const reopenWrongNetwork = useCallback(() => {
    setClosedWhileWrong(false);
  }, []);

  const chainLabel =
    targetChain?.name ??
    (targetChainId != null ? `Chain ${targetChainId}` : "");

  const handleSwitch = () => {
    if (targetChainId == null) return;
    void switchChainAsync?.({ chainId: targetChainId });
  };

  return (
    <WrongNetworkGateContext.Provider value={{ reopenWrongNetwork }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setClosedWhileWrong(true);
        }}
      >
        <DialogContent
          className="min-w-0 overflow-x-hidden sm:max-w-md"
          showCloseButton
        >
          <DialogHeader className="min-w-0 shrink-0">
            <DialogTitle className="pr-8">{t("swap.wrongNetwork")}</DialogTitle>
            <DialogDescription asChild>
              <div className="min-w-0 space-y-2">
                <p className="break-words">{t("wallet.wrongNetworkDialogDesc")}</p>
                {chainLabel ? (
                  <p className="text-foreground break-words font-semibold">
                    {chainLabel}
                  </p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="min-w-0 flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full min-w-0 shrink-0 sm:w-auto"
              onClick={() => setClosedWhileWrong(true)}
            >
              {t("wallet.wrongNetworkLater")}
            </Button>
            <Button
              type="button"
              className="w-full min-w-0 shrink-0 sm:w-auto sm:min-w-[8rem]"
              disabled={isSwitching || targetChainId == null}
              onClick={handleSwitch}
            >
              {t("swap.switchNetwork")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WrongNetworkGateContext.Provider>
  );
}
