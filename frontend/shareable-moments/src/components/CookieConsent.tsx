import { useState, useEffect } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const COOKIE_KEY = 'shyara_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const inRouter = useInRouterContext();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(COOKIE_KEY, 'dismissed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-xl shadow-xl p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-sm font-body text-foreground font-medium">We use cookies</p>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-body leading-relaxed mb-4">
          We use a session cookie to keep you signed in and local storage for your preferences.
          No tracking or advertising cookies are used.{" "}
          {inRouter ? (
            <Link to="/privacy" className="text-primary hover:underline">
              Learn more
            </Link>
          ) : (
            <a href="/privacy" className="text-primary hover:underline">
              Learn more
            </a>
          )}
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 font-body text-xs h-8" onClick={accept}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1 font-body text-xs h-8" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
