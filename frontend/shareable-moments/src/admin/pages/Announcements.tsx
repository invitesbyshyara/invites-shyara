import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/api';
import { AdminAnnouncement } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Send, Eye } from 'lucide-react';

const Announcements: React.FC = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<AdminAnnouncement['recipientTarget']>('all');
  const [sending, setSending] = useState(false);
  const [viewAnn, setViewAnn] = useState<AdminAnnouncement | null>(null);

  useEffect(() => { adminApi.getAnnouncements().then(a => { setHistory(a); setLoading(false); }); }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const ann = await adminApi.sendAnnouncement({ subject, body, recipientTarget: target });
      setHistory(prev => [ann, ...prev]);
      setSubject(''); setBody('');
      toast({ title: 'Announcement sent', description: `Delivered to ${ann.recipientCount} recipients` });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const targetLabels: Record<string, string> = { all: 'All Customers', new_30d: 'New (last 30 days)', active_invites: 'With active invites', specific: 'Specific customer' };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Announcements' }]}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Send Announcement</h2>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Announcement subject..." /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." className="min-h-[150px]" /></div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select value={target} onValueChange={v => setTarget(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="new_30d">New Customers (last 30 days)</SelectItem>
                  <SelectItem value="active_invites">Customers with Active Invites</SelectItem>
                  <SelectItem value="specific">Specific Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}><Send className="h-4 w-4 mr-1" /> {sending ? 'Sending...' : 'Send Announcement'}</Button>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">History</h2>
          {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />)}</div> : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No announcements sent yet</p>
          ) : (
            <div className="space-y-2">
              {history.map(a => (
                <div key={a.id} className="border border-border rounded-md p-3 bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{a.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{targetLabels[a.recipientTarget]} · {a.recipientCount} recipients · {format(new Date(a.dateSent), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewAnn(a)}><Eye className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={!!viewAnn} onOpenChange={() => setViewAnn(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>{viewAnn?.subject}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">{viewAnn && targetLabels[viewAnn.recipientTarget]} · {viewAnn?.recipientCount} recipients · {viewAnn && format(new Date(viewAnn.dateSent), 'dd MMM yyyy, HH:mm')}</p>
            <div className="p-4 border border-border rounded-md bg-muted/30 whitespace-pre-wrap text-sm text-foreground">{viewAnn?.body}</div>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default Announcements;
