import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type Step = 'email' | 'otp' | 'done';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [passError, setPassError] = useState('');

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
    } catch {
      // Always move to OTP step to avoid email enumeration
    } finally {
      setLoading(false);
      setStep('otp');
    }
  };

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (newPass.length < 8) {
      setPassError('Password must be at least 8 characters');
      return;
    }
    if (newPass !== confirmNewPass) {
      setPassError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email, otp, newPass);
      setStep('done');
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.forgotPassword(email);
    } catch {
      // ignore
    }
    toast({ title: 'Code resent', description: 'Check your inbox for a new code.' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="font-display text-2xl font-bold text-foreground">Shyara</Link>
          </div>

          {step === 'email' && (
            <>
              <h1 className="font-display text-3xl font-bold text-center mb-2">Reset your password</h1>
              <p className="text-center text-muted-foreground font-body text-sm mb-8">
                Enter your account email and we'll send you a reset code.
              </p>

              <form onSubmit={handleSubmitEmail} className="space-y-4">
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
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </form>

              <p className="text-center mt-6 text-sm font-body text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline font-medium">← Back to Login</Link>
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="font-display text-3xl font-bold text-center mb-2">Enter reset code</h1>
              <p className="text-muted-foreground font-body text-sm text-center mb-8">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we sent a 6-character code. Enter it below along with your new password.
              </p>

              <form onSubmit={handleSubmitOtp} className="space-y-4">
                <div>
                  <Label htmlFor="otp" className="font-body text-sm">Reset Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    required
                    className="mt-1.5 font-mono tracking-widest"
                  />
                </div>
                <div>
                  <Label htmlFor="newPass" className="font-body text-sm">New Password</Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setPassError(''); }}
                    placeholder="••••••••"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmNewPass" className="font-body text-sm">Confirm New Password</Label>
                  <Input
                    id="confirmNewPass"
                    type="password"
                    value={confirmNewPass}
                    onChange={e => { setConfirmNewPass(e.target.value); setPassError(''); }}
                    placeholder="••••••••"
                    required
                    className="mt-1.5"
                  />
                </div>
                {passError && <p className="text-[hsl(0,72%,51%)] text-xs font-body">{passError}</p>}
                <Button type="submit" disabled={loading} className="w-full h-11 font-body">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>

              <p className="text-center mt-4 text-sm font-body text-muted-foreground">
                Didn't receive it?{' '}
                <button onClick={handleResend} className="text-primary font-medium hover:underline">
                  Resend code
                </button>
              </p>
            </>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-3">Password reset!</h1>
              <p className="text-muted-foreground font-body text-sm mb-8 max-w-sm mx-auto">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link to="/login">
                <Button className="w-full h-11 font-body">Back to Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
