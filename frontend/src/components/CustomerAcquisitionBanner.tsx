import { AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePlatformStatus } from "@/contexts/PlatformStatusContext";

const CustomerAcquisitionBanner = () => {
  const location = useLocation();
  const { status, isLoading } = usePlatformStatus();

  if (isLoading || !status.customerAcquisitionLocked || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="container flex items-start gap-3 px-4 py-3 text-sm font-body">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {status.notice ?? "New customer signups and purchases are temporarily paused while we complete platform verification."}
          {" "}Existing customers can still sign in and manage their invites.
        </p>
      </div>
    </div>
  );
};

export default CustomerAcquisitionBanner;
