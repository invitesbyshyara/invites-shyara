import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const Account = () => {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [notifRsvp, setNotifRsvp] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [verificationSending, setVerificationSending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRecoveryCode, setMfaRecoveryCode] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaRecoveryRemaining, setMfaRecoveryRemaining] = useState(0);
  const [mfaSetupQr, setMfaSetupQr] = useState<string | null>(null);
  const [mfaSetupSecret, setMfaSetupSecret] = useState<string | null>(null);
  const [mfaSetupCode, setMfaSetupCode] = useState('');
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setAvatar(user?.avatar || null);
    setNotifRsvp(user?.emailPreferences?.rsvpNotifications ?? true);
    setNotifWeekly(user?.emailPreferences?.weeklyDigest ?? false);
    setNotifMarketing(user?.emailPreferences?.marketing ?? true);
    setMfaEnabled(Boolean(user?.mfaEnabled));
    setMfaRecoveryRemaining(user?.recoveryCodesRemaining ?? 0);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void api.getMfaStatus()
      .then((status) => {
        setMfaEnabled(status.enabled);
        setMfaRecoveryRemaining(status.recoveryCodesRemaining);
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        name,
        phone,
        avatarUrl: avatar,
        emailPreferences: {
          rsvpNotifications: notifRsvp,
          weeklyDigest: notifWeekly,
          marketing: notifMarketing,
        },
      });
      await refreshUser();
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
    } catch (err) {
      toast({ title: 'Failed to update', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (newPassword.length < 8) errs.newPassword = 'Must be at least 8 characters';
    if (confirmPassword !== newPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    setPasswordTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    if (Object.keys(errs).length > 0) return;

    try {
      const result = await api.updatePassword(currentPassword, newPassword, {
        ...(mfaCode ? { mfaCode } : {}),
        ...(mfaRecoveryCode ? { recoveryCode: mfaRecoveryCode } : {}),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMfaCode('');
      setMfaRecoveryCode('');
      setPasswordErrors({});
      setPasswordTouched({});
      toast({ title: result.message });
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setPasswordErrors({ currentPassword: msg });
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await api.uploadImage(file);
      setAvatar(uploaded.url);
      toast({ title: 'Photo uploaded', description: 'Save your profile to keep this image.' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      e.target.value = '';
    }
  };

  const handleDelete = () => {
    api.deleteAccount()
      .then(async () => {
        await logout();
        toast({ title: 'Account deleted', description: 'Your account and associated data were removed.' });
        navigate('/');
      })
      .catch((err) => {
        toast({ title: 'Failed to delete account', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
      });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleResendVerification = async () => {
    setVerificationSending(true);
    try {
      const result = await api.requestEmailVerification();
      toast({ title: 'Verification sent', description: result.message });
    } catch (err) {
      toast({ title: 'Failed to send verification email', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setVerificationSending(false);
    }
  };

  const handleBeginMfaEnrollment = async () => {
    try {
      const result = await api.beginMfaEnrollment();
      setMfaSetupQr(result.qrCodeDataUrl);
      setMfaSetupSecret(result.secret);
      setNewRecoveryCodes([]);
    } catch (err) {
      toast({ title: 'Unable to start MFA setup', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  };

  const handleVerifyMfaEnrollment = async () => {
    try {
      const result = await api.verifyMfaEnrollment(mfaSetupCode);
      setNewRecoveryCodes(result.recoveryCodes);
      setMfaSetupCode('');
      setMfaSetupQr(null);
      setMfaSetupSecret(null);
      await refreshUser();
      const status = await api.getMfaStatus();
      setMfaEnabled(status.enabled);
      setMfaRecoveryRemaining(status.recoveryCodesRemaining);
      toast({ title: 'MFA enabled', description: 'Store your recovery codes in a safe place.' });
    } catch (err) {
      toast({ title: 'Unable to verify MFA', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  };

  const handleRotateRecoveryCodes = async () => {
    try {
      const result = await api.rotateMfaRecoveryCodes({
        ...(mfaCode ? { code: mfaCode } : {}),
        ...(mfaRecoveryCode ? { recoveryCode: mfaRecoveryCode } : {}),
      });
      setNewRecoveryCodes(result.recoveryCodes);
      setMfaCode('');
      setMfaRecoveryCode('');
      const status = await api.getMfaStatus();
      setMfaRecoveryRemaining(status.recoveryCodesRemaining);
      toast({ title: 'Recovery codes rotated' });
    } catch (err) {
      toast({ title: 'Unable to rotate recovery codes', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  };

  const handleDisableMfa = async () => {
    try {
      const result = await api.disableMfa({
        ...(mfaCode ? { code: mfaCode } : {}),
        ...(mfaRecoveryCode ? { recoveryCode: mfaRecoveryCode } : {}),
      });
      setMfaEnabled(false);
      setMfaRecoveryRemaining(0);
      setNewRecoveryCodes([]);
      setMfaCode('');
      setMfaRecoveryCode('');
      await refreshUser();
      toast({ title: result.message });
    } catch (err) {
      toast({ title: 'Unable to disable MFA', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <div className="flex items-center gap-4 text-sm font-body">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <button onClick={() => void handleLogout()} className="text-muted-foreground hover:text-foreground">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container max-w-2xl py-12 px-4 space-y-8">
        <h1 className="font-display text-3xl font-bold">Account Settings</h1>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <div>
            <Label className="font-body text-sm">Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="font-body text-sm">Email</Label>
            <Input type="email" value={email} disabled className="mt-1.5 opacity-60 cursor-not-allowed" />
            <p className="text-xs text-muted-foreground font-body mt-1">Email cannot be changed.</p>
            {!user?.emailVerified && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Verify your email to unlock invite creation, payments, and collaborator access.
                <Button variant="outline" size="sm" className="mt-3 w-full" disabled={verificationSending} onClick={() => void handleResendVerification()}>
                  {verificationSending ? 'Sending...' : 'Resend verification email'}
                </Button>
              </div>
            )}
          </div>
          <div>
            <Label className="font-body text-sm">Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5" />
          </div>
          <div>
            <Label className="font-body text-sm">Profile Photo</Label>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-display font-bold text-xl overflow-hidden">
                {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : (name.charAt(0) || '?')}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarSelect} />
              <Button variant="outline" size="sm" className="font-body text-xs" onClick={() => fileRef.current?.click()}>Upload Photo</Button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="font-body">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">Change Password</h2>
          <div>
            <Label className="font-body text-sm">Current Password</Label>
            <Input type="password" className="mt-1.5" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPasswordErrors(p => { const n = {...p}; delete n.currentPassword; return n; }); }} onBlur={() => setPasswordTouched(p => ({...p, currentPassword: true}))} />
            {passwordTouched.currentPassword && passwordErrors.currentPassword && <p className="text-[hsl(0,72%,51%)] text-xs mt-1 font-body">{passwordErrors.currentPassword}</p>}
          </div>
          <div>
            <Label className="font-body text-sm">New Password</Label>
            <Input type="password" className="mt-1.5" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordErrors(p => { const n = {...p}; delete n.newPassword; return n; }); }} onBlur={() => setPasswordTouched(p => ({...p, newPassword: true}))} />
            {passwordTouched.newPassword && passwordErrors.newPassword && <p className="text-[hsl(0,72%,51%)] text-xs mt-1 font-body">{passwordErrors.newPassword}</p>}
          </div>
          <div>
            <Label className="font-body text-sm">Confirm Password</Label>
            <Input type="password" className="mt-1.5" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordErrors(p => { const n = {...p}; delete n.confirmPassword; return n; }); }} onBlur={() => setPasswordTouched(p => ({...p, confirmPassword: true}))} />
            {passwordTouched.confirmPassword && passwordErrors.confirmPassword && <p className="text-[hsl(0,72%,51%)] text-xs mt-1 font-body">{passwordErrors.confirmPassword}</p>}
          </div>
          {mfaEnabled && (
            <>
              <div>
                <Label className="font-body text-sm">Authenticator Code</Label>
                <Input value={mfaCode} onChange={e => setMfaCode(e.target.value)} placeholder="123456" className="mt-1.5" />
              </div>
              <div>
                <Label className="font-body text-sm">Recovery Code</Label>
                <Input value={mfaRecoveryCode} onChange={e => setMfaRecoveryCode(e.target.value.toUpperCase())} placeholder="ABCD-EFGH" className="mt-1.5" />
              </div>
            </>
          )}
          <Button variant="outline" className="font-body" onClick={() => void handlePasswordChange()}>Update Password</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">Email on new RSVP</p>
              <p className="text-xs text-muted-foreground font-body">Receive an email when a guest responds.</p>
            </div>
            <Switch checked={notifRsvp} onCheckedChange={setNotifRsvp} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">Weekly summary</p>
              <p className="text-xs text-muted-foreground font-body">Get a weekly digest of invite activity.</p>
            </div>
            <Switch checked={notifWeekly} onCheckedChange={setNotifWeekly} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">Product updates</p>
              <p className="text-xs text-muted-foreground font-body">Receive occasional updates about new Shyara features.</p>
            </div>
            <Switch checked={notifMarketing} onCheckedChange={setNotifMarketing} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">Multi-Factor Authentication</h2>
          <p className="text-sm text-muted-foreground font-body">
            {mfaEnabled
              ? `MFA is enabled. ${mfaRecoveryRemaining} recovery codes remain unused.`
              : 'Add an authenticator app to protect your account.'}
          </p>
          {!mfaEnabled ? (
            <>
              {!mfaSetupQr ? (
                <Button variant="outline" onClick={() => void handleBeginMfaEnrollment()}>Enable MFA</Button>
              ) : (
                <div className="space-y-4">
                  <img src={mfaSetupQr} alt="MFA setup QR code" className="h-48 w-48 rounded-lg border border-border bg-white p-2" />
                  {mfaSetupSecret && <p className="text-xs font-mono text-muted-foreground break-all">{mfaSetupSecret}</p>}
                  <div>
                    <Label className="font-body text-sm">Authenticator code</Label>
                    <Input value={mfaSetupCode} onChange={e => setMfaSetupCode(e.target.value)} placeholder="123456" className="mt-1.5" />
                  </div>
                  <Button onClick={() => void handleVerifyMfaEnrollment()}>Verify and Enable</Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="font-body text-sm">Authenticator code</Label>
                <Input value={mfaCode} onChange={e => setMfaCode(e.target.value)} placeholder="123456" className="mt-1.5" />
              </div>
              <div>
                <Label className="font-body text-sm">Recovery code</Label>
                <Input value={mfaRecoveryCode} onChange={e => setMfaRecoveryCode(e.target.value.toUpperCase())} placeholder="ABCD-EFGH" className="mt-1.5" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void handleRotateRecoveryCodes()}>Rotate Recovery Codes</Button>
                <Button variant="destructive" onClick={() => void handleDisableMfa()}>Disable MFA</Button>
              </div>
            </div>
          )}
          {newRecoveryCodes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-950">Save these recovery codes</p>
              <div className="space-y-1 text-sm font-mono text-amber-950">
                {newRecoveryCodes.map((code) => (
                  <div key={code}>{code}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-destructive/30 bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground font-body mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <Button variant="destructive" size="sm" className="font-body" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-display text-lg font-semibold mb-2">Delete Account</h3>
            <p className="text-sm text-muted-foreground font-body mb-6">This will permanently delete your account, all invitations, and all RSVP data. Are you absolutely sure?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-body" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1 font-body" onClick={handleDelete}>Yes, Delete Everything</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
