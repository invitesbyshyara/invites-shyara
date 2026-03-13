import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";
import { PlatformStatus } from "@/types";

const LOCKED_FALLBACK: PlatformStatus = {
  customerAcquisitionLocked: true,
  notice: "New customer signups and purchases are temporarily paused while we complete platform verification.",
};

type PlatformStatusContextValue = {
  status: PlatformStatus;
  isLoading: boolean;
};

const PlatformStatusContext = createContext<PlatformStatusContextValue | null>(null);

export const PlatformStatusProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<PlatformStatus>(LOCKED_FALLBACK);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api.getPlatformStatus()
      .then((result) => {
        if (mounted) {
          setStatus(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus(LOCKED_FALLBACK);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PlatformStatusContext.Provider value={{ status, isLoading }}>
      {children}
    </PlatformStatusContext.Provider>
  );
};

export const usePlatformStatus = () => {
  const context = useContext(PlatformStatusContext);
  if (!context) {
    throw new Error("usePlatformStatus must be used within PlatformStatusProvider");
  }
  return context;
};
