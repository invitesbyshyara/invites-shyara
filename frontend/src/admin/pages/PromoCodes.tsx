import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { adminApi } from '../services/api';
import { AdminPromoCode, CURRENCY_SYMBOLS } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const PromoCodes: React.FC = () => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPromoCode | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [code, setCode] = useState(''); const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState(10); const [appliesTo, setAppliesTo] = useState<'all' | 'template' | 'category'>('all');
  const [usageLimit, setUsageLimit] = useState(100); const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    Promise.all([adminApi.getPromoCodes(), adminApi.getSettings()]).then(([promoCodes, settings]) => {
      setCodes(promoCodes);
      setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? '$');
      setLoading(false);
    });
  }, []);

  const fmt = (cents: number) => `${currencySymbol}${(cents / 100).toFixed(2)}`;

  const handleCreate = async () => {
    try {
      const created = await adminApi.createPromoCode({ code: code.toUpperCase(), discountType, discountValue, appliesTo, usageLimit, expiryDate });
      setCodes(prev => [...prev, created]);
      setCreateOpen(false);
      toast({ title: 'Promo code created' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const toggleStatus = async (p: AdminPromoCode) => {
    const newStatus = p.status === 'active' ? 'disabled' : 'active';
    const updated = await adminApi.updatePromoCode(p.id, { status: newStatus as any });
    setCodes(prev => prev.map(c => c.id === p.id ? updated : c));
    toast({ title: `Code ${newStatus}` });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminApi.deletePromoCode(deleteTarget.id);
    setCodes(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast({ title: 'Code deleted' });
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Promo Codes' }]} requiredPermission="manage_promo_codes">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Promo Codes</h2>
        <Button size="sm" onClick={() => { setCode(''); setDiscountType('percentage'); setDiscountValue(10); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Create Code</Button>
      </div>
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-md" />)}</div> : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="text-left px-3 py-2">Code</th><th className="text-left px-3 py-2">Discount</th><th className="text-left px-3 py-2">Applies To</th><th className="text-left px-3 py-2">Usage</th><th className="text-left px-3 py-2">Expiry</th><th className="text-left px-3 py-2">Status</th><th className="px-3 py-2"></th>
            </tr></thead>
            <tbody>{codes.map(p => (
              <React.Fragment key={p.id}>
                <tr className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono font-bold text-foreground">{p.code}</td>
                  <td className="px-3 py-2">{p.discountType === 'percentage' ? `${p.discountValue}%` : fmt(p.discountValue)}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{p.appliesTo}{p.appliesToValue ? `: ${p.appliesToValue}` : ''}</td>
                  <td className="px-3 py-2">{p.usageCount}/{p.usageLimit}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.expiryDate}</td>
                  <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleStatus(p)}>{p.status === 'active' ? 'Disable' : 'Enable'}</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>{expandedId === p.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
                {expandedId === p.id && (
                  <tr><td colSpan={7} className="px-6 py-3 bg-muted/30">
                    {p.usageDetails.length === 0 ? <p className="text-sm text-muted-foreground">No usage yet</p> : (
                      <div className="space-y-1">{p.usageDetails.map((u, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{u.customerName} ({u.customerEmail}) — {u.templateName} on {u.date}</p>
                      ))}</div>
                    )}
                  </td></tr>
                )}
              </React.Fragment>
            ))}</tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Promo Code</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="SUMMER20" className="uppercase" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Type</Label><Select value={discountType} onValueChange={v => setDiscountType(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="flat">Flat Amount</SelectItem></SelectContent></Select></div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} />
                {discountType === 'flat' && <p className="text-xs text-muted-foreground">Enter flat discount in cents (e.g., 200 = {currencySymbol}2.00).</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Usage Limit</Label><Input type="number" value={usageLimit} onChange={e => setUsageLimit(Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmModal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Promo Code" description={`Delete "${deleteTarget?.code}"?`} confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </AdminLayout>
  );
};

export default PromoCodes;
