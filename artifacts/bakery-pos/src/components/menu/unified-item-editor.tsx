import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createCategory, createMenuItem, updateMenuItem, Category, MenuItem } from '@/lib/rtdb';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface TierState {
  id: string;
  label: string;
  weightLb: string;
  price: string;
  isCustom: boolean;
  isNew: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingItem: MenuItem | null;
  categories: Category[];
  defaultCategoryId?: string;
}

const PRESETS = ['0.5', '1', '2', '3'];
const ADD_NEW_CATEGORY_OPTION = '__add_new_category__';

export default function UnifiedItemEditor({ isOpen, onClose, existingItem, categories, defaultCategoryId }: Props) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [pricingMode, setPricingMode] = useState<'piece' | 'weight'>('piece');
  const [unitPrice, setUnitPrice] = useState('');
  const [trackStock, setTrackStock] = useState(true);
  const [active, setActive] = useState(true);
  
  const [tiers, setTiers] = useState<TierState[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setShowCategoryInput(false);
    setNewCategoryName('');
    if (existingItem) {
      setName(existingItem.name);
      setCategoryId(existingItem.categoryId);
      setPricingMode(existingItem.pricingMode);
      setUnitPrice(existingItem.unitPrice?.toString() || '');
      setTrackStock(existingItem.trackStock);
      setActive(existingItem.active);
      if (existingItem.pricingMode === 'weight' && existingItem.tiers) {
         const tierEntries = Object.entries(existingItem.tiers);
         setTiers(tierEntries.map(([id, t]) => {
          const isPreset = t.weightLb !== null && PRESETS.includes(t.weightLb.toString());
          return {
            id,
            label: t.label,
            weightLb: t.weightLb?.toString() || '',
            price: t.price.toString(),
            isCustom: !isPreset,
            isNew: false
          };
        }));
      } else {
        setTiers([]);
      }
    } else {
      setName('');
      setCategoryId(defaultCategoryId || categories[0]?.id || '');
      setPricingMode('piece');
      setUnitPrice('');
      setTrackStock(true);
      setActive(true);
      setTiers([]);
    }
  }, [existingItem?.id, isOpen]);

  const handleTogglePreset = (weight: string) => {
    const existing = tiers.find(t => t.weightLb === weight && !t.isCustom);
    if (existing) {
      setTiers(tiers.filter(t => t.id !== existing.id));
    } else {
      setTiers([...tiers, {
        id: `preset_${weight}_${Date.now()}`,
        label: `${weight} lb`,
        weightLb: weight,
        price: '',
        isCustom: false,
        isNew: true
      }]);
    }
  };

  const handleAddCustomTier = () => {
    setTiers([...tiers, { 
      id: `custom_${Date.now()}`, 
      label: '', 
      weightLb: '', 
      price: '', 
      isCustom: true,
      isNew: true
    }]);
  };

  const handleTierChange = (id: string, field: keyof TierState, value: string) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleCreateCategoryInline = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast({ title: 'Validation', description: 'Category name is required', variant: 'destructive' });
      return;
    }

    setIsCreatingCategory(true);
    try {
      const maxSortOrder = categories.reduce((max, category) => Math.max(max, category.sortOrder), 0);
      const newCategoryId = await createCategory({
        name: trimmedName,
        active: true,
        sortOrder: maxSortOrder + 1,
      });
      setCategoryId(newCategoryId);
      setNewCategoryName('');
      setShowCategoryInput(false);
      toast({ title: 'Category added', description: `${trimmedName} is selected for this item.` });
    } catch (err: any) {
      toast({ title: 'Category not added', description: err?.message || 'Could not create the category.', variant: 'destructive' });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId) {
      toast({ title: 'Validation', description: 'Name and Category are required', variant: 'destructive' });
      return;
    }

    let parsedUnitPrice: number | null = null;
    let finalTiers: Record<string, { label: string; weightLb: number | null; price: number }> | null = null;
    const initialInventory: Record<string, number> = {};

    if (pricingMode === 'piece') {
      parsedUnitPrice = parseFloat(unitPrice);
      if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
        toast({ title: 'Validation', description: 'Valid positive unit price required', variant: 'destructive' });
        return;
      }
      
      initialInventory['piece'] = 0;
    } else {
      if (tiers.length === 0) {
        toast({ title: 'Validation', description: 'At least one tier required for weight items', variant: 'destructive' });
        return;
      }
      finalTiers = {};
      for (const t of tiers) {
        if (!t.label.trim()) {
          toast({ title: 'Validation', description: 'All tiers need a valid label', variant: 'destructive' });
          return;
        }
        const tPrice = parseFloat(t.price);
        if (isNaN(tPrice) || tPrice < 0) {
          toast({ title: 'Validation', description: 'All tiers need a valid positive price', variant: 'destructive' });
          return;
        }
        
        const isNewTier = t.isNew;
        finalTiers[t.id] = {
          label: t.label,
          weightLb: t.weightLb ? parseFloat(t.weightLb) : null,
          price: tPrice
        };
        initialInventory[t.id] = 0;
      }
    }

    setIsSaving(true);
    try {
      if (existingItem) {
        const inventoryOps = {
          removeKeys: [] as string[],
          addKeys: {} as Record<string, { tierId: string | null; qty: number; lowStockLevel: number }>,
          updateKeys: {} as Record<string, { lowStockLevel: number }>
        };

        if (existingItem.pricingMode === 'piece' && pricingMode === 'weight') {
          inventoryOps.removeKeys.push(`${existingItem.id}`);
          Object.keys(finalTiers || {}).forEach(tierId => {
            inventoryOps.addKeys[`${existingItem.id}__${tierId}`] = {
              tierId,
              qty: initialInventory[tierId],
              lowStockLevel: 5
            };
          });
        } else if (existingItem.pricingMode === 'weight' && pricingMode === 'piece') {
          Object.keys(existingItem.tiers || {}).forEach(tierId => {
            inventoryOps.removeKeys.push(`${existingItem.id}__${tierId}`);
          });
          inventoryOps.addKeys[`${existingItem.id}`] = {
            tierId: null,
            qty: initialInventory['piece'] || 0,
              lowStockLevel: 5
          };
        } else if (pricingMode === 'weight') {
          const oldTiers = Object.keys(existingItem.tiers || {});
          const newTiers = Object.keys(finalTiers || {});
          
          oldTiers.forEach(tierId => {
            if (!newTiers.includes(tierId)) {
              inventoryOps.removeKeys.push(`${existingItem.id}__${tierId}`);
            }
          });
          
          newTiers.forEach(tierId => {
            if (!oldTiers.includes(tierId)) {
              inventoryOps.addKeys[`${existingItem.id}__${tierId}`] = {
                tierId,
                qty: initialInventory[tierId],
            lowStockLevel: 5
              };
            }
          });
        }

        await updateMenuItem(existingItem.id, {
          name: name.trim(),
          categoryId,
          pricingMode,
          unitPrice: parsedUnitPrice,
          tiers: finalTiers,
          trackStock,
          active
        }, inventoryOps);
        
        toast({ title: 'Item updated' });
      } else {
        await createMenuItem({
          name: name.trim(),
          categoryId,
          pricingMode,
          unitPrice: parsedUnitPrice,
          tiers: finalTiers,
          trackStock,
          active
        }, initialInventory, 5);
        toast({ title: 'Item created' });
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
      <DialogContent className="bg-[#14161B] border-[#FF6D00]/20 text-white sm:max-w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>{existingItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#E2E8F0]">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} disabled={isSaving} className="bg-[#0E0F12] border-[#FF6D00]/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#E2E8F0]">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  if (value === ADD_NEW_CATEGORY_OPTION) {
                    setNewCategoryName('');
                    setShowCategoryInput(true);
                  } else {
                    setCategoryId(value);
                    setShowCategoryInput(false);
                  }
                }}
                disabled={isSaving || isCreatingCategory}
              >
                <SelectTrigger className="bg-[#0E0F12] border-[#FF6D00]/20 text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-[#14161B] border-[#FF6D00]/20 text-white">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value={ADD_NEW_CATEGORY_OPTION} className="font-semibold text-[#FFD54F]">
                    + Add New Category...
                  </SelectItem>
                </SelectContent>
              </Select>
              {showCategoryInput && (
                <div className="mt-2 space-y-2">
                  <Input
                    autoFocus
                    aria-label="New category name"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleCreateCategoryInline();
                      }
                    }}
                    disabled={isCreatingCategory || isSaving}
                    placeholder="Enter category name"
                    maxLength={48}
                    className="h-9 bg-[#0E0F12] text-white placeholder:text-slate-400"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleCreateCategoryInline()}
                      disabled={isCreatingCategory || isSaving || !newCategoryName.trim()}
                      className="h-8 bg-[#FF6D00] px-3 text-white hover:bg-[#F4511E]"
                    >
                      {isCreatingCategory && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Add
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryInput(false);
                        setNewCategoryName('');
                      }}
                      disabled={isCreatingCategory || isSaving}
                      className="text-sm font-medium text-slate-200 underline-offset-4 hover:text-white hover:underline disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#E2E8F0]">Pricing Type</Label>
            <div className="flex bg-[#0E0F12] p-1 rounded-xl border border-[#FF6D00]/20">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${pricingMode === 'piece' ? 'bg-[#FF6D00]/20 text-[#FFB300]' : 'text-slate-200 hover:text-white'}`}
                onClick={() => !isSaving && setPricingMode('piece')}
              >
                Per Piece
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${pricingMode === 'weight' ? 'bg-[#FF6D00]/20 text-[#FFB300]' : 'text-slate-200 hover:text-white'}`}
                onClick={() => !isSaving && setPricingMode('weight')}
              >
                By Weight / Pound
              </button>
            </div>
          </div>

          {pricingMode === 'piece' ? (
            <div className="grid grid-cols-2 gap-4 bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10">
              <div className="space-y-2">
                <Label className="text-[#E2E8F0]">Price (NPR)</Label>
                <Input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} disabled={isSaving} className="bg-[#14161B] border-[#FF6D00]/20 font-mono" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10">
              <div className="space-y-2">
                <Label className="text-[#E2E8F0] text-xs uppercase tracking-wider">Weight Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(w => {
                    const active = tiers.some(t => t.weightLb === w && !t.isCustom);
                    return (
                      <button key={w} type="button" onClick={() => !isSaving && handleTogglePreset(w)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-[#FF6D00] text-white border-[#FF6D00]' : 'bg-[#14161B] text-slate-200 border-[#2A2D35] hover:border-[#FF6D00]/50'}`}>
                        {w} lb
                      </button>
                    )
                  })}
                  <button type="button" onClick={() => !isSaving && handleAddCustomTier()} className="px-3 py-1.5 rounded-full text-sm font-medium border bg-[#14161B] text-slate-200 border-[#2A2D35] hover:border-[#FF6D00]/50 border-dashed">
                    + Custom
                  </button>
                </div>
              </div>
              
              {tiers.length > 0 && (
                <div className="space-y-3 mt-4">
                  {tiers.map(t => (
                    <div key={t.id} className="p-3 bg-[#14161B] border border-[#2A2D35] rounded-lg relative flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                         {t.isCustom ? (
                           <div className="grid grid-cols-2 gap-2 w-full pr-8">
                             <Input placeholder="Label (e.g. Box)" value={t.label} onChange={e => handleTierChange(t.id, 'label', e.target.value)} disabled={isSaving} className="h-8 bg-[#0E0F12] text-sm border-[#2A2D35]" />
                             <Input placeholder="Weight lbs (opt)" type="number" value={t.weightLb} onChange={e => handleTierChange(t.id, 'weightLb', e.target.value)} disabled={isSaving} className="h-8 bg-[#0E0F12] text-sm font-mono border-[#2A2D35]" />
                           </div>
                         ) : (
                           <div className="text-white font-bold text-sm h-8 flex items-center">{t.label}</div>
                         )}
                          <Button type="button" aria-label={`Remove ${t.label || 'custom'} tier`} variant="ghost" size="icon" onClick={() => !isSaving && setTiers(tiers.filter(x=>x.id!==t.id))} className="absolute top-2 right-2 h-11 w-11 text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5"/></Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-200 uppercase">Price (NPR)</Label>
                          <Input type="number" value={t.price} onChange={e => handleTierChange(t.id, 'price', e.target.value)} disabled={isSaving} className="h-8 bg-[#0E0F12] text-sm font-mono border-[#2A2D35]" />
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between bg-[#0E0F12] p-3 rounded-xl border border-[#FF6D00]/10">
              <Label className="text-[#E2E8F0]">Item Status</Label>
              <Switch checked={active} onCheckedChange={setActive} disabled={isSaving} />
            </div>
            <div className="flex items-center justify-between bg-[#0E0F12] p-3 rounded-xl border border-[#FF6D00]/10">
              <div>
                <Label className="text-[#E2E8F0] block leading-tight">Track Inventory</Label>
                <span className="text-[10px] text-slate-200">Disable for unlimited items</span>
              </div>
              <Switch checked={trackStock} onCheckedChange={setTrackStock} disabled={isSaving} />
            </div>
          </div>
          
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-200 hover:text-white" disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white border-none shadow-[0_0_15px_rgba(255,109,0,0.3)]" disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}