import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformStatus } from '@/contexts/PlatformStatusContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, pendingTemplateSlug, setPendingTemplateSlug } = useAuth();
  const { status, isLoading: platformLoading } = usePlatformStatus();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const continuingCheckout = next?.startsWith('/checkout/');
  const signupsLocked = platformLoading || status.customerAcquisitionLocked;

  const handleRedirect = () => {
    if (pendingTemplateSlug) {
      const slug = pendingTemplateSlug;
      setPendingTemplateSlug(null);
      navigate(`/checkout/${slug}`);
    } else if (next) {
      navigate(next);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast({ title: 'Welcome back!', description: 'You\'ve signed in successfully.' });
      handleRedirect();
    } catch (err) {
      toast({ title: 'Login failed', description: err instanceof Error ? err.message : 'Please check your credentials.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-foreground">Shyara</Link>
          <h1 className="font-display text-3xl font-bold mt-6 mb-2">Welcome back</h1>
          <p className="text-muted-foreground font-body text-sm">
            {continuingCheckout ? 'Sign in to continue your template purchase' : 'Sign in to manage your invitations'}
          </p>
        </div>

        {signupsLocked && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 font-body">
            New customer signups are temporarily paused while we complete platform verification. Existing customers can still sign in here.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-body text-sm">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password" className="font-body text-sm">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1.5" />
            <div className="flex justify-end mt-1.5">
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary font-body transition-colors">Forgot password?</Link>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-11 font-body">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {signupsLocked ? (
          <p className="text-center mt-6 text-sm font-body text-muted-foreground">
            New accounts are temporarily unavailable.
          </p>
        ) : (
          <p className="text-center mt-6 text-sm font-body text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        )}
      </div>
      </div>
    </div>
  );
};

export default Login;
