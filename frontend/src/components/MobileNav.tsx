import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, LayoutGrid, CreditCard, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/templates', label: 'Browse Templates', icon: LayoutGrid },
  { to: '/pricing', label: 'Pricing', icon: CreditCard },
  { to: '/i/demo-invite', label: 'Live Demo', icon: Eye },
];

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-accent transition-colors"
          aria-label="Menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 p-0 border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-display text-lg font-bold text-foreground">Shyara</span>
          <SheetClose asChild>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </SheetClose>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col px-4 pt-4 pb-2 gap-1">
          {navLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-primary/10 text-primary dark:bg-primary/15'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.label}
                  {isActive(link.to) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-5 my-2 border-t border-border" />

        {/* Auth Links */}
        <div className="flex flex-col px-4 gap-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-all"
            >
              Log in
            </Link>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="px-5 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Button
              asChild
              className="w-full rounded-xl h-12 text-sm font-semibold gap-2"
              onClick={() => setOpen(false)}
            >
              <Link to="/register">
                <Sparkles className="w-4 h-4" />
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Footer note */}
        <div className="absolute bottom-6 left-0 right-0 px-5">
          <p className="text-xs text-muted-foreground text-center">
            Beautiful digital invitations ✨
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
