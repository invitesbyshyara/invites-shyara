import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <span className="text-[120px] md:text-[160px] font-display font-bold leading-none text-primary/10">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">💌</span>
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold mb-3">Page Not Found</h1>
          <p className="text-muted-foreground font-body mb-8 leading-relaxed">
            This page seems to have gone missing — like an invitation that never arrived.
            Let's get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="font-body">
              <Link to="/">Go to Homepage</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-body">
              <Link to="/templates">Browse Templates</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-body mt-8">
            Looking for a live invite? Check the URL and try again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
