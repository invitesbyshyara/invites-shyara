import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformStatus } from '@/contexts/PlatformStatusContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register: registerFn, isLoading, pendingTemplateSlug, setPendingTemplateSlug } = useAuth();
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

    if (signupsLocked) {
      toast({
        title: 'Signups are paused',
        description: status.notice ?? 'New customer accounts are temporarily unavailable.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Passwords don\'t match', variant: 'destructive' });
      return;
    }

    try {
      await registerFn(name, email, password);
      toast({ title: 'Welcome to Shyara!', description: 'Account created successfully.' });
      handleRedirect();
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="font-display text-2xl font-bold text-foreground">Shyara</Link>
            <h1 className="font-display text-3xl font-bold mt-6 mb-2">Create your account</h1>
            <p className="text-muted-foreground font-body text-sm">
              {signupsLocked
                ? 'New customer signups are temporarily paused while we complete platform verification.'
                : continuingCheckout
                  ? 'Create your account to continue your template purchase'
                  : 'Start creating beautiful invitations'}
            </p>
          </div>

          {signupsLocked && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 font-body">
              Existing customers can still <Link to="/login" className="font-medium underline underline-offset-4">sign in</Link> and manage their invites. New accounts will reopen once verification is complete.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-body text-sm">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required disabled={signupsLocked} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email" className="font-body text-sm">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required disabled={signupsLocked} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password" className="font-body text-sm">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required disabled={signupsLocked} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="confirm" className="font-body text-sm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required disabled={signupsLocked} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={isLoading || signupsLocked} className="w-full h-11 font-body">
              {signupsLocked ? 'New signups temporarily paused' : isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm font-body text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
