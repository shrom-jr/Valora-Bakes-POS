import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createCategory, updateCategory, Category } from '@/lib/rtdb';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingCategory: Category | null;
  maxSortOrder: number;
}

export default function UnifiedCategoryEditor({ isOpen, onClose, existingCategory, maxSortOrder }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
      setActive(existingCategory.active);
    } else {
      setName('');
      setActive(true);
    }
  }, [existingCategory, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Category name is required', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      if (existingCategory) {
        await updateCategory(existingCategory.id, { name: name.trim(), active });
        toast({ title: 'Category updated' });
      } else {
        await createCategory({ name: name.trim(), active, sortOrder: maxSortOrder + 1 });
        toast({ title: 'Category created' });
      }
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#14161B] border-[#FF6D00]/20 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[#E2E8F0]">Category Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} disabled={isSaving} className="bg-[#0E0F12] border-[#FF6D00]/20 focus-visible:ring-[#FFD54F]" placeholder="e.g. Breads" />
          </div>
          <div className="flex items-center justify-between bg-[#0E0F12] p-3 rounded-xl border border-[#FF6D00]/20">
            <Label className="text-[#E2E8F0]">Active Status</Label>
            <Switch checked={active} onCheckedChange={setActive} disabled={isSaving} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving} className="text-[#94A3B8] hover:text-white">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}