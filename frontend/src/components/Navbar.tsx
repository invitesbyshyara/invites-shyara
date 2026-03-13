import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, LayoutDashboard, LogOut, MessageSquareQuote, PlayCircle, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Currency, useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { to: "/templates", label: "Templates" },
  { to: "/#how-it-works", label: "How It Works" },
  { to: "/#included", label: "What's Included" },
  { to: "/#host-tools", label: "Host Tools" },
  { to: "/samples/rustic-charm", label: "Live Sample" },
  { to: "/pricing", label: "Pricing" },
];

const isLinkActive = (pathname: string, currentPath: string, linkTo: string) => {
  const targetPath = linkTo.startsWith("/#") ? "/" : linkTo;

  if (linkTo === "/") {
    return pathname === "/";
  }

  if (linkTo.startsWith("/#")) {
    return pathname === "/";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/92 backdrop-blur-lg shadow-sm border-b border-border"
          : "bg-background/75 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="container flex items-center justify-between gap-4 h-16">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <Heart
            className="w-5 h-5 text-primary transition-transform duration-200 group-hover:scale-110"
            fill="currentColor"
          />
          <span className="font-serif text-xl font-semibold tracking-tight group-hover:text-primary transition-colors duration-200">
            Shyara
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5 min-w-0">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-2.5 py-2 text-sm font-medium transition-colors ${
                isLinkActive(link.to, location.pathname, link.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
              {isLinkActive(link.to, location.pathname, link.to) && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute inset-x-3 -bottom-[5px] h-0.5 rounded-full bg-primary"
                />
              )}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                isLinkActive("/dashboard", location.pathname, "/dashboard")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
            className="text-xs font-medium text-muted-foreground bg-transparent border border-border rounded-lg px-2.5 py-1.5 cursor-pointer"
            aria-label="Currency"
          >
            <option value="USD">$ USD</option>
            <option value="EUR">EUR</option>
          </select>

          {isAuthenticated ? (
            <>
              <Button asChild size="sm" variant="outline" className="rounded-full px-4">
                <Link to="/account">
                  <MessageSquareQuote className="w-4 h-4 mr-2" />
                  Account
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-4 shadow-romantic">
                <Link to="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <button
                onClick={() => void logout()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Log in
              </Link>
              <Button asChild size="sm" className="rounded-full px-5 shadow-romantic">
                <Link to="/templates">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Exploring
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <ThemeToggle />
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
            className="text-xs font-medium text-muted-foreground bg-transparent border border-border rounded-lg px-2 py-1.5 cursor-pointer"
            aria-label="Currency"
          >
            <option value="USD">$</option>
            <option value="EUR">EUR</option>
          </select>
          <MobileNav
            links={[
              { to: "/templates", label: "Templates", icon: Sparkles },
              { to: "/#how-it-works", label: "How It Works", icon: Wallet },
              { to: "/#included", label: "What's Included", icon: ShieldCheck },
              { to: "/#host-tools", label: "Host Tools", icon: LayoutDashboard },
              { to: "/samples/rustic-charm", label: "Live Sample", icon: PlayCircle },
              { to: "/pricing", label: "Pricing", icon: Wallet },
              { to: "/#faq", label: "FAQ", icon: MessageSquareQuote },
              ...(isAuthenticated ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
            ]}
            isAuthenticated={isAuthenticated}
            onLogout={() => void logout()}
          />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
