import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle, Mail, ExternalLink } from "lucide-react";

interface ShareMenuProps {
  shareUrl: string;
  inviteUrl: string;
  message: string;
  variant?: "stack" | "row";
}

const ShareMenu = ({ shareUrl, inviteUrl, message, variant = "row" }: ShareMenuProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = inviteUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  const handleEmail = () => {
    window.open(
      `mailto:?subject=You%27re%20Invited&body=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
  };

  const handleOpen = () => {
    window.open(inviteUrl, "_blank", "noopener");
  };

  const isStack = variant === "stack";
  const containerClass = isStack
    ? "flex flex-col gap-2 w-full"
    : "flex flex-row flex-wrap gap-2";

  const btnClass = isStack ? "w-full justify-start gap-3 font-body text-sm" : "font-body text-sm";

  return (
    <div className={containerClass}>
      <Button variant="outline" className={btnClass} onClick={handleCopy}>
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </Button>

      <Button variant="outline" className={btnClass} onClick={handleWhatsApp}>
        <MessageCircle className="w-4 h-4 text-green-500" />
        Share on WhatsApp
      </Button>

      <Button variant="outline" className={btnClass} onClick={handleEmail}>
        <Mail className="w-4 h-4 text-blue-500" />
        Share via Email
      </Button>

      <Button variant="outline" className={btnClass} onClick={handleOpen}>
        <ExternalLink className="w-4 h-4" />
        Open Invite
      </Button>
    </div>
  );
};

export default ShareMenu;
