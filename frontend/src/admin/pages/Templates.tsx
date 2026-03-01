import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { adminApi } from '../services/api';
import { AdminTemplate } from '../types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, LayoutGrid, List } from 'lucide-react';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplate | null>(null);

  useEffect(() => { adminApi.getTemplates().then(t => { setTemplates(t); setLoading(false); }); }, []);

  const toggleVisibility = async (t: AdminTemplate) => {
    const updated = await adminApi.updateTemplate(t.slug, { isVisible: !t.isVisible });
    setTemplates(prev => prev.map(x => x.slug === t.slug ? updated : x));
    toast({ title: `Template ${updated.isVisible ? 'shown' : 'hidden'}` });
  };

  const toggleFeatured = async (t: AdminTemplate) => {
    const updated = await adminApi.updateTemplate(t.slug, { isFeatured: !t.isFeatured });
    setTemplates(prev => prev.map(x => x.slug === t.slug ? updated : x));
    toast({ title: `Template ${updated.isFeatured ? 'featured' : 'unfeatured'}` });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteTemplate(deleteTarget.slug);
      setTemplates(prev => prev.filter(t => t.slug !== deleteTarget.slug));
      setDeleteTarget(null);
      toast({ title: 'Template deleted' });
    } catch (e: any) {
      toast({ title: 'Cannot delete', description: e.message, variant: 'destructive' });
      setDeleteTarget(null);
    }
  };

  if (loading) return (
    <AdminLayout breadcrumbs={[{ label: 'Templates' }]} requiredPermission="manage_templates">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout breadcrumbs={[{ label: 'Templates' }]} requiredPermission="manage_templates">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">All Templates</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewMode(v => v === 'grid' ? 'table' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/templates/new')}><Plus className="h-4 w-4 mr-1" /> Add Template</Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map(t => (
            <div key={t.slug} className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="h-28 bg-muted flex items-center justify-center relative">
                <img src={t.thumbnail} alt={t.name} className="h-full w-full object-cover" />
                {t.isFeatured && <span className="absolute top-2 right-2 bg-amber-500 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded">â˜… Featured</span>}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-card-foreground">{t.name}</h3>
                  <StatusBadge status={t.isVisible ? 'visible' : 'hidden'} />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <StatusBadge status={t.isFree ? 'free' : 'premium'} />
                  <span className="text-xs text-muted-foreground">{t.category}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  ${(t.priceUsd / 100).toFixed(2)} / €{(t.priceEur / 100).toFixed(2)} · {t.purchaseCount} purchased · {t.previewCount} previews
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/templates/${t.slug}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(t)}>{t.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleFeatured(t)}><Star className={`h-3.5 w-3.5 ${t.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} /></Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={t.purchaseCount > 0} onClick={() => setDeleteTarget(t)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {t.purchaseCount > 0 && <TooltipContent>Purchased {t.purchaseCount} times, {t.activeInviteCount} active â€” deletion blocked</TooltipContent>}
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Category</th><th className="text-left px-3 py-2">Price</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Purchases</th><th className="px-3 py-2">Actions</th>
            </tr></thead>
            <tbody>{templates.map(t => (
              <tr key={t.slug} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium text-foreground">{t.name} {t.isFeatured && <span className="text-amber-500">â˜…</span>}</td>
                <td className="px-3 py-2 text-muted-foreground capitalize">{t.category}</td>
                <td className="px-3 py-2">${(t.priceUsd / 100).toFixed(2)} / €{(t.priceEur / 100).toFixed(2)}</td>
                <td className="px-3 py-2"><StatusBadge status={t.isVisible ? 'visible' : 'hidden'} /></td>
                <td className="px-3 py-2">{t.purchaseCount}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/templates/${t.slug}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(t)}>{t.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Template" description={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </AdminLayout>
  );
};

export default Templates;



