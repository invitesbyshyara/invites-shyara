import { Link } from "react-router-dom";
import { Button, ButtonProps } from "@/components/ui/button";
import { usePlatformStatus } from "@/contexts/PlatformStatusContext";

type PurchaseCtaButtonProps = Pick<ButtonProps, "className" | "size" | "variant"> & {
  slug: string;
  openLabel: string;
  lockedLabel?: string;
};

const PurchaseCtaButton = ({
  slug,
  openLabel,
  lockedLabel = "Purchases paused",
  variant = "default",
  size = "default",
  className,
}: PurchaseCtaButtonProps) => {
  const { status, isLoading } = usePlatformStatus();

  if (isLoading || status.customerAcquisitionLocked) {
    return (
      <Button
        type="button"
        disabled
        variant={variant === "default" ? "secondary" : variant}
        size={size}
        className={className}
      >
        {lockedLabel}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link to={`/checkout/${slug}`}>{openLabel}</Link>
    </Button>
  );
};

export default PurchaseCtaButton;
