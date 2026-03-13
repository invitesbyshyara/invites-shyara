import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PurchaseCtaButton from "@/components/PurchaseCtaButton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TemplateConfig } from "@/types";
import PhoneMockup from "@/components/PhoneMockup";
import TemplateThumbnail from "@/components/TemplateThumbnail";

interface QuickPreviewProps {
  template: TemplateConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickPreview = ({ template, open, onOpenChange }: QuickPreviewProps) => {
  const { currency, formatPrice } = useCurrency();

  if (!template) {
    return null;
  }

  const price = currency === "USD" ? template.priceUsd : template.priceEur;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-background border-border">
        <DialogTitle className="sr-only">{template.name} quick preview</DialogTitle>
        <div className="flex flex-col items-center py-8 px-6">
          <PhoneMockup>
            <TemplateThumbnail config={template} />
          </PhoneMockup>

          <div className="mt-6 text-center w-full">
            <h3 className="font-display text-xl font-bold">{template.name}</h3>
            <p className="text-sm text-muted-foreground font-body capitalize mt-1">
              {template.category.replace("-", " ")} • {formatPrice(price)}
            </p>
            <p className="text-sm text-muted-foreground font-body mt-3">
              Preview the design first. Personalization starts after purchase.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-5">
              <Button variant="outline" className="font-body" asChild>
                <Link to={`/templates/${template.slug}/preview`}>Studio Preview</Link>
              </Button>
              <Button variant="outline" className="font-body" asChild>
                <Link to={`/samples/${template.slug}`}>Live Sample</Link>
              </Button>
              <PurchaseCtaButton slug={template.slug} openLabel="Buy & Customize" className="font-body" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickPreview;
