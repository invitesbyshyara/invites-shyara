import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TemplateConfig } from "@/types";
import PhoneMockup from "@/components/PhoneMockup";
import TemplateThumbnail from "@/components/TemplateThumbnail";

interface Props {
  template: TemplateConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickPreview = ({ template, open, onOpenChange }: Props) => {
  const { currency, formatPrice } = useCurrency();

  if (!template) {
    return null;
  }

  const price = currency === "USD" ? template.priceUsd : template.priceEur;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-background border-border">
        <DialogTitle className="sr-only">{template.name} Preview</DialogTitle>
        <div className="flex flex-col items-center py-8 px-6">
          <PhoneMockup>
            <TemplateThumbnail config={template} />
          </PhoneMockup>

          <div className="mt-6 text-center w-full">
            <h3 className="font-display text-xl font-bold">{template.name}</h3>
            <p className="text-sm text-muted-foreground font-body capitalize mt-1">
              {template.category.replace("-", " ")} · {formatPrice(price)}
            </p>
            <div className="flex gap-3 mt-5 justify-center">
              <Button variant="outline" className="font-body" asChild>
                <Link to={`/templates/${template.slug}/preview`}>
                  Full Preview
                </Link>
              </Button>
              <Button asChild className="font-body">
                <Link to={`/checkout/${template.slug}`}>Use This Template</Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickPreview;
