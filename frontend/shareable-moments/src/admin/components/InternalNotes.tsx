import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { InternalNote } from '../types';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface InternalNotesProps {
  entityId: string;
  entityType: 'customer' | 'invite';
}

const InternalNotes: React.FC<InternalNotesProps> = ({ entityId, entityType }) => {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminApi.getNotes(entityId, entityType).then(n => { setNotes(n); setLoading(false); });
  }, [entityId, entityType]);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      const note = await adminApi.addNote({ entityId, entityType, content: content.trim(), authorEmail: user.email });
      setNotes(prev => [note, ...prev]);
      setContent('');
      toast({ title: 'Note added' });
    } catch {
      toast({ title: 'Failed to add note', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Add an internal note..." className="min-h-[80px]" />
      </div>
      <Button onClick={handleSubmit} disabled={!content.trim() || submitting} size="sm">
        <MessageSquare className="h-4 w-4 mr-1" /> Add Note
      </Button>

      {notes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">No internal notes yet</div>
      )}

      <div className="space-y-3">
        {notes.map(note => (
          <div key={note.id} className="border border-border rounded-md p-3 bg-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">{note.authorEmail}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm')}</span>
            </div>
            <p className="text-sm text-card-foreground whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternalNotes;
