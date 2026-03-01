import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MobileNav from '@/components/MobileNav';
import ThemeToggle from '@/components/ThemeToggle';
import { Currency, useCurrency } from '@/contexts/CurrencyContext';
import { motion } from 'framer-motion';

const navLinks = [
  { to: '/templates', label: 'Templates' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/i/demo-invite', label: 'Live Demo' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-card/95 backdrop-blur-md shadow-sm border-border'
          : 'bg-card/60 backdrop-blur-sm border-transparent'
      }`}
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-200">
            Shyara
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isActive(link.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/15 rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="text-xs font-medium text-muted-foreground bg-transparent border border-border rounded px-2 py-1 cursor-pointer"
          >
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Right Actions */}
        <div className="flex md:hidden items-center gap-1.5">
          <ThemeToggle />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="text-xs font-medium text-muted-foreground bg-transparent border border-border rounded px-2 py-1 cursor-pointer"
          >
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
          <MobileNav />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
