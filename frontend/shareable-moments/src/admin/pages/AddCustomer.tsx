import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createCustomer({ name, email, phone, plan });
      toast({ title: 'Customer created' });
      navigate('/admin/customers');
    } catch { toast({ title: 'Failed to create customer', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Customers', to: '/admin/customers' }, { label: 'Add Customer' }]}>
      <div className="max-w-lg">
        <h2 className="text-lg font-semibold text-foreground mb-4">Add Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={v => setPlan(v as 'free' | 'premium')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Customer'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/customers')}>Cancel</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddCustomer;
