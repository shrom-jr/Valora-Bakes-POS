import React, { useState } from 'react';
import { useCategories, useMenuItems } from '@/hooks/use-rtdb';
import { createCategory, updateCategory, deleteCategory, swapCategorySortOrders } from '@/lib/rtdb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit2, Trash2, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function CategoriesTab() {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  
  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setActive(true);
    setIsModalOpen(true);
  };
  
  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setActive(cat.active);
    setIsModalOpen(true);
  };
  
  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), active });
        toast({ title: 'Category updated' });
      } else {
        const maxSort = categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) : 0;
        await createCategory({ name: name.trim(), active, sortOrder: maxSort + 1 });
        toast({ title: 'Category created' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    try {
      if (direction === 'up' && index > 0) {
        const current = categories[index];
        const prev = categories[index - 1];
        await swapCategorySortOrders(current.id, current.sortOrder, prev.id, prev.sortOrder);
      } else if (direction === 'down' && index < categories.length - 1) {
        const current = categories[index];
        const next = categories[index + 1];
        await swapCategorySortOrders(current.id, current.sortOrder, next.id, next.sortOrder);
      }
    } catch (err: any) {
      toast({ title: 'Error moving category', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const hasItems = items.some(i => i.categoryId === id);
    if (hasItems) {
      toast({ title: 'Cannot delete', description: 'Category is used by existing menu items.', variant: 'destructive' });
      return;
    }
    if (window.confirm('Delete this category?')) {
      try {
        await deleteCategory(id);
        toast({ title: 'Category deleted' });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    }
  };

  if (catError || itemsError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0E0F12] rounded-xl border border-destructive/20">
        <AlertCircle className="w-10 h-10 text-destructive mb-4" />
        <p className="text-white font-bold mb-2">Error loading categories</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="bg-[#14161B] text-white border-destructive/20 hover:bg-[#2A2D35]">
          Retry
        </Button>
      </div>
    );
  }

  if (catLoading || itemsLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin stroke-[url(#flame-grad)]" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Categories</h2>
        <Button onClick={handleOpenNew} className="bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white border-none rounded-xl active:scale-95 transition-all">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center p-12 bg-[#0E0F12] rounded-xl border border-[#FF6D00]/20 border-dashed">
          <p className="text-[#E2E8F0] mb-4">No categories created yet.</p>
          <Button onClick={handleOpenNew} variant="outline" className="bg-[#14161B] text-white border-[#FF6D00]/20 hover:bg-[#2A2D35]">
            Create First Category
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center justify-between bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10 hover:border-[#FF6D00]/30 transition-colors">
              <div className="flex flex-col">
                <span className={`font-bold ${cat.active ? 'text-white' : 'text-[#94A3B8] line-through'}`}>{cat.name}</span>
                <span className="text-xs text-[#94A3B8]">{cat.active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleMove(i, 'up')} disabled={i === 0} className="text-[#94A3B8] hover:text-white">
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleMove(i, 'down')} disabled={i === categories.length - 1} className="text-[#94A3B8] hover:text-white">
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-[#2A2D35] mx-1" />
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(cat)} className="text-[#94A3B8] hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#14161B] border-[#FF6D00]/20 text-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[#E2E8F0]">Category Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-[#0E0F12] border-[#FF6D00]/20 focus-visible:ring-[#FFD54F]" placeholder="e.g. Breads" />
            </div>
            <div className="flex items-center justify-between bg-[#0E0F12] p-3 rounded-xl border border-[#FF6D00]/20">
              <Label className="text-[#E2E8F0]">Active Status</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[#94A3B8] hover:text-white">Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white">Save Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}