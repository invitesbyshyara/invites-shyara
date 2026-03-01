import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  const handleResend = () => {
    setSent(false);
    // email stays pre-filled
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="font-display text-2xl font-bold text-foreground">Shyara</Link>
          </div>

          {!sent ? (
            <>
              <h1 className="font-display text-3xl font-bold text-center mb-2">Reset your password</h1>
              <p className="text-center text-muted-foreground font-body text-sm mb-8">
                Enter your account email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="font-body text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 font-body">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <p className="text-center mt-6 text-sm font-body text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline font-medium">← Back to Login</Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-3">Check your inbox</h1>
              <p className="text-muted-foreground font-body text-sm mb-8 max-w-sm mx-auto">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a password reset link. It may take a few minutes to arrive.
              </p>

              <Link to="/login">
                <Button className="w-full h-11 font-body mb-4">Back to Login</Button>
              </Link>

              <button
                onClick={handleResend}
                className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
              >
                Didn't receive it? <span className="text-primary font-medium">Resend</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
