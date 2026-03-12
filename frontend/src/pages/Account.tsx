import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const Account = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});

  // Avatar
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Notifications
  const [notifRsvp, setNotifRsvp] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('shyara_avatar');
    if (savedAvatar) setAvatar(savedAvatar);
    const savedRsvp = localStorage.getItem('shyara_notif_rsvp');
    const savedWeekly = localStorage.getItem('shyara_notif_weekly');
    if (savedRsvp !== null) setNotifRsvp(savedRsvp === 'true');
    if (savedWeekly !== null) setNotifWeekly(savedWeekly === 'true');
  }, []);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ name, email, phone });
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
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
      await api.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      setPasswordTouched({});
      toast({ title: 'Password updated successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setPasswordErrors({ currentPassword: msg });
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      localStorage.setItem('shyara_avatar', result);
    };
    reader.readAsDataURL(file);
  };

  const handleNotifRsvp = (val: boolean) => {
    setNotifRsvp(val);
    localStorage.setItem('shyara_notif_rsvp', String(val));
  };

  const handleNotifWeekly = (val: boolean) => {
    setNotifWeekly(val);
    localStorage.setItem('shyara_notif_weekly', String(val));
  };

  const handleDelete = () => {
    api.deleteAccount()
      .then(async () => {
        await logout();
        toast({ title: 'Account deleted', description: 'Your account and associated data were removed.' });
        navigate('/');
      })
      .catch(() => {
        toast({ title: 'Failed to delete account', variant: 'destructive' });
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <div className="flex items-center gap-4 text-sm font-body">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <button onClick={logout} className="text-muted-foreground hover:text-foreground">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container max-w-xl py-12 px-4 space-y-8">
        <h1 className="font-display text-3xl font-bold">Account Settings</h1>

        {/* Profile */}
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
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              <Button variant="outline" size="sm" className="font-body text-xs" onClick={() => fileRef.current?.click()}>Upload Photo</Button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="font-body">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Password */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">Change Password</h2>
          <div>
            <Label className="font-body text-sm">Current Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1.5" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPasswordErrors(p => { const n = {...p}; delete n.currentPassword; return n; }); }} onBlur={() => setPasswordTouched(p => ({...p, currentPassword: true}))} />
            {passwordTouched.currentPassword && passwordErrors.currentPassword && <p className="text-[hsl(0,72%,51%)] text-xs mt-1 font-body">{passwordErrors.currentPassword}</p>}
          </div>
          <div>
            <Label className="font-body text-sm">New Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1.5" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordErrors(p => { const n = {...p}; delete n.newPassword; return n; }); }} onBlur={() => setPasswordTouched(p => ({...p, newPassword: true}))} />
            {passwordTouched.newPassword && passwordErrors.newPassword && <p className="text-[hsl(0,72%,51%)] text-xs mt-1 font-body">{passwordErrors.newPassword}</p>}
          </div>
          <div>
            <Label className="font-body text-sm">Confirm Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1.5" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordErrors(p => { const n = {...p}; delete n.confirmPassword; return n; }); }} onBlur={() => setPasswordTouched(p => ({...p, confirmPassword: true}))} />
            {passwordTouched.confirmPassword && passwordErrors.confirmPassword && <p className="text-[hsl(0,72%,51%)] text-xs mt-1 font-body">{passwordErrors.confirmPassword}</p>}
          </div>
          <Button variant="outline" className="font-body" onClick={handlePasswordChange}>Update Password</Button>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold">Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">Email on new RSVP</p>
              <p className="text-xs text-muted-foreground font-body">Get notified when a guest responds</p>
            </div>
            <Switch checked={notifRsvp} onCheckedChange={handleNotifRsvp} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">Weekly summary</p>
              <p className="text-xs text-muted-foreground font-body">Receive a weekly digest of activity</p>
            </div>
            <Switch checked={notifWeekly} onCheckedChange={handleNotifWeekly} />
          </div>
        </div>

        {/* Danger Zone */}
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
