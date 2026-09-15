import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createMenuItem, updateMenuItem, Category, MenuItem, ShelfInventory } from '@/lib/rtdb';
import { Plus, Trash2 } from 'lucide-react';

interface TierState {
  id: string;
  label: string;
  weightLb: string;
  price: string;
  initialStock: string;
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItem: MenuItem | null;
  categories: Category[];
  inventory: Record<string, ShelfInventory>;
}

export default function ItemModal({ isOpen, onClose, existingItem, categories, inventory }: ItemModalProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pricingMode, setPricingMode] = useState<'piece' | 'weight'>('piece');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialPieceStock, setInitialPieceStock] = useState('');
  const [lowStockLevel, setLowStockLevel] = useState('5');
  const [trackStock, setTrackStock] = useState(true);
  const [active, setActive] = useState(true);
  
  const [tiers, setTiers] = useState<TierState[]>([]);

  useEffect(() => {
    if (existingItem) {
      setName(existingItem.name);
      setCategoryId(existingItem.categoryId);
      setPricingMode(existingItem.pricingMode);
      setUnitPrice(existingItem.unitPrice?.toString() || '');
      setTrackStock(existingItem.trackStock);
      setActive(existingItem.active);
      
      const invEntry = inventory[existingItem.id];
      if (invEntry) {
        setLowStockLevel(invEntry.lowStockLevel.toString());
      }
      
      if (existingItem.pricingMode === 'weight' && existingItem.tiers) {
        setTiers(Object.entries(existingItem.tiers).map(([id, t]) => {
          const tInv = inventory[`${existingItem.id}__${id}`];
          if (tInv) setLowStockLevel(tInv.lowStockLevel.toString());
          return {
            id,
            label: t.label,
            weightLb: t.weightLb?.toString() || '',
            price: t.price.toString(),
            initialStock: '', // Only used for new tiers during edit
          };
        }));
      } else {
        setTiers([{ id: Date.now().toString(), label: '', weightLb: '', price: '', initialStock: '' }]);
      }
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setPricingMode('piece');
      setUnitPrice('');
      setInitialPieceStock('');
      setLowStockLevel('5');
      setTrackStock(true);
      setActive(true);
      setTiers([{ id: Date.now().toString(), label: '', weightLb: '', price: '', initialStock: '' }]);
    }
  }, [existingItem, categories, inventory]);

  const handleAddTier = () => {
    setTiers([...tiers, { id: Date.now().toString(), label: '', weightLb: '', price: '', initialStock: '' }]);
  };

  const handleRemoveTier = (id: string) => {
    setTiers(tiers.filter(t => t.id !== id));
  };

  const handleTierChange = (id: string, field: keyof TierState, value: string) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId) {
      toast({ title: 'Validation', description: 'Name and Category are required', variant: 'destructive' });
      return;
    }

    const parsedLowStock = parseInt(lowStockLevel);
    if (isNaN(parsedLowStock) || parsedLowStock < 0) {
      toast({ title: 'Validation', description: 'Low stock level must be a nonnegative integer', variant: 'destructive' });
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
      
      const parsedPieceStock = initialPieceStock === '' ? 0 : parseInt(initialPieceStock);
      if (!existingItem && (isNaN(parsedPieceStock) || parsedPieceStock < 0)) {
        toast({ title: 'Validation', description: 'Initial stock must be a nonnegative integer', variant: 'destructive' });
        return;
      }
      initialInventory['piece'] = parsedPieceStock;
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
        
        // For new items or newly added tiers in edit mode, validate initial stock
        const tStockStr = t.initialStock;
        const isNewTier = !existingItem || (existingItem.pricingMode === 'weight' && existingItem.tiers && !existingItem.tiers[t.id]) || (existingItem.pricingMode === 'piece');
        
        let tStock = 0;
        if (isNewTier) {
          tStock = tStockStr === '' ? 0 : parseInt(tStockStr);
          if (isNaN(tStock) || tStock < 0) {
            toast({ title: 'Validation', description: 'Initial stock for new tiers must be a nonnegative integer', variant: 'destructive' });
            return;
          }
        }
        
        finalTiers[t.id] = {
          label: t.label,
          weightLb: t.weightLb ? parseFloat(t.weightLb) : null,
          price: tPrice
        };
        initialInventory[t.id] = tStock;
      }
    }

    try {
      if (existingItem) {
        const inventoryOps = {
          removeKeys: [] as string[],
          addKeys: {} as Record<string, { tierId: string | null; qty: number; lowStockLevel: number }>
        };

        if (existingItem.pricingMode === 'piece' && pricingMode === 'weight') {
          inventoryOps.removeKeys.push(`${existingItem.id}`);
          Object.keys(finalTiers || {}).forEach(tierId => {
            inventoryOps.addKeys[`${existingItem.id}__${tierId}`] = {
              tierId,
              qty: initialInventory[tierId],
              lowStockLevel: parsedLowStock
            };
          });
        } else if (existingItem.pricingMode === 'weight' && pricingMode === 'piece') {
          Object.keys(existingItem.tiers || {}).forEach(tierId => {
            inventoryOps.removeKeys.push(`${existingItem.id}__${tierId}`);
          });
          inventoryOps.addKeys[`${existingItem.id}`] = {
            tierId: null,
            qty: initialInventory['piece'] || 0,
            lowStockLevel: parsedLowStock
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
                lowStockLevel: parsedLowStock
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
        }, initialInventory, parsedLowStock);
        toast({ title: 'Item created' });
      }
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#14161B] border-[#FF6D00]/20 text-white sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#E2E8F0]">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-[#0E0F12] border-[#FF6D00]/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#E2E8F0]">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-[#0E0F12] border-[#FF6D00]/20 text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-[#14161B] border-[#FF6D00]/20 text-white">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#E2E8F0]">Pricing Mode</Label>
            <div className="flex bg-[#0E0F12] p-1 rounded-xl border border-[#FF6D00]/20">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${pricingMode === 'piece' ? 'bg-[#2A2D35] text-white' : 'text-[#94A3B8] hover:text-white'}`}
                onClick={() => setPricingMode('piece')}
              >
                By Piece
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${pricingMode === 'weight' ? 'bg-[#2A2D35] text-white' : 'text-[#94A3B8] hover:text-white'}`}
                onClick={() => setPricingMode('weight')}
              >
                By Weight
              </button>
            </div>
          </div>

          {pricingMode === 'piece' ? (
            <div className="grid grid-cols-2 gap-4 bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10">
              <div className="space-y-2">
                <Label className="text-[#E2E8F0]">Unit Price (NPR)</Label>
                <Input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="bg-[#14161B] border-[#FF6D00]/20 font-mono" />
              </div>
              {(!existingItem || existingItem.pricingMode !== 'piece') && trackStock && (
                <div className="space-y-2">
                  <Label className="text-[#E2E8F0]">Initial Stock</Label>
                  <Input type="number" value={initialPieceStock} onChange={e => setInitialPieceStock(e.target.value)} className="bg-[#14161B] border-[#FF6D00]/20 font-mono" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-[#E2E8F0]">Weight Tiers</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddTier} className="h-8 text-[#FFB300] hover:text-[#FF6D00] hover:bg-[#FF6D00]/10">
                  <Plus className="w-4 h-4 mr-1" /> Add Tier
                </Button>
              </div>
              {tiers.map((t) => {
                const isNewTier = !existingItem || (existingItem.pricingMode === 'weight' && existingItem.tiers && !existingItem.tiers[t.id]) || (existingItem.pricingMode === 'piece');
                return (
                  <div key={t.id} className="flex gap-2 items-start bg-[#14161B] p-2 rounded-lg border border-[#2A2D35]">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Label (e.g. 0.5 kg)" value={t.label} onChange={e => handleTierChange(t.id, 'label', e.target.value)} className="bg-[#0E0F12] border-none text-sm h-8" />
                      <Input placeholder="Price (NPR)" type="number" value={t.price} onChange={e => handleTierChange(t.id, 'price', e.target.value)} className="bg-[#0E0F12] border-none text-sm h-8 font-mono" />
                    </div>
                    {isNewTier && trackStock && (
                      <div className="w-24">
                        <Input placeholder="Stock" type="number" value={t.initialStock} onChange={e => handleTierChange(t.id, 'initialStock', e.target.value)} className="bg-[#0E0F12] border-none text-sm h-8 font-mono" />
                      </div>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTier(t.id)} disabled={tiers.length === 1} className="text-destructive h-8 w-8 hover:bg-destructive/10 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between bg-[#0E0F12] p-3 rounded-xl border border-[#FF6D00]/10">
            <div>
              <Label className="text-[#E2E8F0] block">Track Inventory</Label>
              <span className="text-xs text-[#94A3B8]">Disable for unlimited stock items</span>
            </div>
            <Switch checked={trackStock} onCheckedChange={setTrackStock} />
          </div>
          
          {trackStock && (
            <div className="flex items-center justify-between bg-[#0E0F12] p-3 rounded-xl border border-[#FF6D00]/10">
              <Label className="text-[#E2E8F0]">Low Stock Warning Level</Label>
              <Input type="number" value={lowStockLevel} onChange={e => setLowStockLevel(e.target.value)} className="w-24 bg-[#14161B] border-[#FF6D00]/20 font-mono text-center" />
            </div>
          )}

          <div className="flex items-center justify-between bg-[#0E0F12] p-3 rounded-xl border border-[#FF6D00]/10">
            <Label className="text-[#E2E8F0]">Active Status</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#94A3B8] hover:text-white">Cancel</Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white border-none shadow-[0_0_15px_rgba(255,109,0,0.3)]">Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}