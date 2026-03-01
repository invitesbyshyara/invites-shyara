import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { adminApi } from '../services/api';
import { AdminCategory } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const Categories: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editCat, setEditCat] = useState<AdminCategory | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [emoji, setEmoji] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  useEffect(() => { adminApi.getCategories().then(c => { setCategories(c); setLoading(false); }); }, []);

  const openAdd = () => { setEditCat(null); setName(''); setSlug(''); setEmoji('📋'); setEditOpen(true); };
  const openEdit = (c: AdminCategory) => { setEditCat(c); setName(c.name); setSlug(c.slug); setEmoji(c.emoji); setEditOpen(true); };

  const handleSave = async () => {
    try {
      if (editCat) {
        const updated = await adminApi.updateCategory(editCat.id, { name, emoji });
        setCategories(prev => prev.map(c => c.id === editCat.id ? updated : c));
        toast({ title: 'Category updated' });
      } else {
        const created = await adminApi.createCategory({ name, slug, emoji });
        setCategories(prev => [...prev, created]);
        toast({ title: 'Category created' });
      }
      setEditOpen(false);
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: 'Category deleted' });
    } catch (e: any) { toast({ title: 'Cannot delete', description: e.message, variant: 'destructive' }); setDeleteTarget(null); }
  };

  const toggleVisibility = async (c: AdminCategory) => {
    const updated = await adminApi.updateCategory(c.id, { isVisible: !c.isVisible });
    setCategories(prev => prev.map(x => x.id === c.id ? updated : x));
    toast({ title: `Category ${updated.isVisible ? 'shown' : 'hidden'}` });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    // Update displayOrder values
    const reordered = newOrder.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    setCategories(reordered);
    try {
      await adminApi.reorderCategories(reordered.map(c => c.id));
      toast({ title: 'Order updated' });
    } catch { toast({ title: 'Reorder failed', variant: 'destructive' }); }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const reordered = newOrder.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    setCategories(reordered);
    try {
      await adminApi.reorderCategories(reordered.map(c => c.id));
      toast({ title: 'Order updated' });
    } catch { toast({ title: 'Reorder failed', variant: 'destructive' }); }
  };

  return (
    <AdminLayout breadcrumbs={[{ label: 'Categories' }]} requiredPermission="manage_categories">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Event Categories</h2>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
      </div>
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-md" />)}</div> : (
        <div className="space-y-2">
          {categories.map((c, index) => (
            <div key={c.id} className="flex items-center gap-3 p-3 border border-border rounded-md bg-card">
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveUp(index)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === categories.length - 1} onClick={() => handleMoveDown(index)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="text-xl">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.templateCount} templates · /{c.slug}</p>
              </div>
              <StatusBadge status={c.isVisible ? 'visible' : 'hidden'} />
              <Switch checked={c.isVisible} onCheckedChange={() => toggleVisibility(c)} />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={c.templateCount > 0} onClick={() => setDeleteTarget(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            {!editCat && <div className="space-y-2"><Label>Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} /></div>}
            <div className="space-y-2"><Label>Emoji</Label><Input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-20" /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmModal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Category" description={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </AdminLayout>
  );
};

export default Categories;
