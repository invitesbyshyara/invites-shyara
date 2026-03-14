import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '../services/api';

const AdminLogin: React.FC = () => {
  const { login, isLoading, user, setUser } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    if (user && recoveryCodes.length === 0 && !mfaChallengeId) {
      navigate('/admin', { replace: true });
    }
  }, [mfaChallengeId, navigate, recoveryCodes.length, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      if ('requiresMfa' in result && result.requiresMfa) {
        setMfaChallengeId(result.challengeId);
        setRequiresSetup(false);
        return;
      }
      if ('requiresMfaSetup' in result && result.requiresMfaSetup) {
        const enrollment = await adminApi.beginMfaEnrollment(result.challengeId);
        setMfaChallengeId(result.challengeId);
        setRequiresSetup(true);
        setQrCodeDataUrl(enrollment.qrCodeDataUrl);
        return;
      }
      navigate('/admin');
    } catch (err) {
      toast({
        title: 'Admin sign-in failed',
        description: err instanceof Error ? err.message : 'Check your backend connection and credentials.',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallengeId) {
      return;
    }

    try {
      if (requiresSetup) {
        const result = await adminApi.verifyMfaEnrollment(mfaChallengeId, mfaCode);
        setUser(result.admin);
        setRecoveryCodes(result.recoveryCodes);
        toast({ title: 'MFA enabled', description: 'Save your recovery codes before continuing.' });
        return;
      }

      const result = await adminApi.completeMfaLogin(mfaChallengeId, {
        ...(mfaCode ? { code: mfaCode } : {}),
        ...(recoveryCode ? { recoveryCode } : {}),
      });
      setUser(result.admin);
      navigate('/admin');
    } catch (err) {
      toast({
        title: 'Verification failed',
        description: err instanceof Error ? err.message : 'Enter a valid authentication code.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-body text-foreground">Shyara Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Internal portal access only</p>
        </div>
        {!mfaChallengeId ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="support@shyara.co.in" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        ) : (
        <form onSubmit={handleVerifyMfa} className="space-y-4">
          {requiresSetup && qrCodeDataUrl && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app, then enter the generated code below.</p>
              <img src={qrCodeDataUrl} alt="MFA QR code" className="mx-auto h-48 w-48 rounded-lg border border-border bg-white p-2" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="mfaCode">{requiresSetup ? 'Authenticator setup code' : 'Authenticator code'}</Label>
            <Input id="mfaCode" value={mfaCode} onChange={e => setMfaCode(e.target.value)} placeholder="123456" />
          </div>
          {!requiresSetup && (
            <div className="space-y-2">
              <Label htmlFor="recoveryCode">Recovery code</Label>
              <Input id="recoveryCode" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value.toUpperCase())} placeholder="ABCD-EFGH" />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {requiresSetup ? 'Enable MFA' : 'Verify'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setMfaChallengeId(null);
              setRequiresSetup(false);
              setQrCodeDataUrl(null);
              setMfaCode('');
              setRecoveryCode('');
              setRecoveryCodes([]);
            }}
          >
            Back
          </Button>
          {recoveryCodes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-950">Recovery codes</p>
              <div className="space-y-1 text-sm font-mono text-amber-950">
                {recoveryCodes.map((code) => (
                  <div key={code}>{code}</div>
                ))}
              </div>
              <Button type="button" className="w-full" onClick={() => navigate('/admin')}>
                Continue to Admin
              </Button>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
