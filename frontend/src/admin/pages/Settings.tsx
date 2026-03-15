import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/api';
import { AdminSettings } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';
import { getCheckoutPrice } from '@/lib/packageCatalog';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(s => {
      setSettings(s);
      setInitialSettings(JSON.parse(JSON.stringify(s)));
      setLoading(false);
    });
  }, []);

  const isDirty = settings && initialSettings && JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const update = (partial: Partial<AdminSettings>) => setSettings(prev => prev ? { ...prev, ...partial } : prev);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      const refreshed = await adminApi.getSettings();
      setSettings(refreshed);
      setInitialSettings(JSON.parse(JSON.stringify(refreshed)));
      toast({ title: 'Settings saved' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const resetSection = (section: string) => {
    if (!initialSettings || !settings) return;
    switch (section) {
      case 'currency': update({ currency: initialSettings.currency }); break;
      case 'fileSizes': update({ maxFileSizes: { ...initialSettings.maxFileSizes } }); break;
      case 'rsvp': update({ rsvpDeadlineDays: initialSettings.rsvpDeadlineDays }); break;
      case 'maintenance': update({ maintenanceMode: initialSettings.maintenanceMode }); break;
      case 'featureFlags': update({ featureFlags: JSON.parse(JSON.stringify(initialSettings.featureFlags)) }); break;
    }
  };

  if (loading) return <AdminLayout breadcrumbs={[{ label: 'Settings' }]} requiredPermission="manage_settings"><Skeleton className="h-96 rounded-lg" /></AdminLayout>;

  return (
    <AdminLayout breadcrumbs={[{ label: 'Settings' }]} requiredPermission="manage_settings">
      <div className="max-w-2xl space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Platform Settings</h2>

        {/* Currency */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Currency</CardTitle>
              <button onClick={() => resetSection('currency')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reset</button>
            </div>
            <CardDescription>Choose the platform display currency</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={settings!.currency} onValueChange={v => update({ currency: v as AdminSettings['currency'] })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Pricing Defaults</CardTitle>
            </div>
            <CardDescription>Checkout pricing is now fixed by package, add-on, and renewal intent.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">Package A</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${ (getCheckoutPrice('initial_purchase', 'package_a', 'USD') / 100).toFixed(2) } / €{ (getCheckoutPrice('initial_purchase', 'package_a', 'EUR') / 100).toFixed(2) }
                </p>
                <p className="text-xs text-muted-foreground mt-2">All features included from day one.</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">Package B</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${ (getCheckoutPrice('initial_purchase', 'package_b', 'USD') / 100).toFixed(2) } / €{ (getCheckoutPrice('initial_purchase', 'package_b', 'EUR') / 100).toFixed(2) }
                </p>
                <p className="text-xs text-muted-foreground mt-2">Invite-only first, with a premium design direction.</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">Package B add-on</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${ (getCheckoutPrice('event_management_addon', 'package_b', 'USD') / 100).toFixed(2) } / €{ (getCheckoutPrice('event_management_addon', 'package_b', 'EUR') / 100).toFixed(2) }
                </p>
                <p className="text-xs text-muted-foreground mt-2">Unlocks RSVP and the event-management workspace later.</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">Renewal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${ (getCheckoutPrice('renewal', 'package_a', 'USD') / 100).toFixed(2) } / €{ (getCheckoutPrice('renewal', 'package_a', 'EUR') / 100).toFixed(2) }
                </p>
                <p className="text-xs text-muted-foreground mt-2">Restores another 3 month validity window.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Sizes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Asset Size Limits (MB)</CardTitle>
              <button onClick={() => resetSection('fileSizes')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reset</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Cover Image</Label><Input type="number" value={settings!.maxFileSizes.coverImage} onChange={e => update({ maxFileSizes: { ...settings!.maxFileSizes, coverImage: Number(e.target.value) } })} /></div>
              <div className="space-y-2"><Label>Gallery Photo</Label><Input type="number" value={settings!.maxFileSizes.galleryPhoto} onChange={e => update({ maxFileSizes: { ...settings!.maxFileSizes, galleryPhoto: Number(e.target.value) } })} /></div>
              <div className="space-y-2"><Label>Intro Animation</Label><Input type="number" value={settings!.maxFileSizes.introAnimation} onChange={e => update({ maxFileSizes: { ...settings!.maxFileSizes, introAnimation: Number(e.target.value) } })} /></div>
            </div>
          </CardContent>
        </Card>

        {/* RSVP */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">RSVP Settings</CardTitle>
              <button onClick={() => resetSection('rsvp')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reset</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs"><Label>Default deadline (days before event)</Label><Input type="number" value={settings!.rsvpDeadlineDays} onChange={e => update({ rsvpDeadlineDays: Number(e.target.value) })} /></div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Maintenance Mode</CardTitle>
              <button onClick={() => resetSection('maintenance')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reset</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch checked={settings!.maintenanceMode} onCheckedChange={v => update({ maintenanceMode: v })} />
              <span className="text-sm text-muted-foreground">{settings!.maintenanceMode ? 'ON â€” Customer site shows maintenance banner' : 'OFF'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Feature Flags</CardTitle>
              <button onClick={() => resetSection('featureFlags')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reset</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {settings!.featureFlags.map((ff, i) => (
              <div key={ff.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-background">
                <div>
                  <p className="text-sm font-medium text-foreground">{ff.label}</p>
                  <p className="text-xs text-muted-foreground">{ff.description}</p>
                </div>
                <Switch checked={ff.enabled} onCheckedChange={v => {
                  const flags = [...settings!.featureFlags];
                  flags[i] = { ...flags[i], enabled: v };
                  update({ featureFlags: flags });
                }} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="h-16" /> {/* spacer for sticky bar */}
      </div>

      {/* Sticky unsaved changes bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex items-center justify-center gap-3 shadow-lg z-50">
          <span className="text-sm font-medium text-foreground">You have unsaved changes</span>
          <Button variant="outline" size="sm" onClick={() => { setSettings(JSON.parse(JSON.stringify(initialSettings))); }}>Discard</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </div>
      )}
    </AdminLayout>
  );
};

export default Settings;

