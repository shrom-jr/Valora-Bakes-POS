import React, { useState } from 'react';
import { useCategories, useMenuItems, useShelfInventory } from '@/hooks/use-rtdb';
import { deleteMenuItem } from '@/lib/rtdb';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import ItemModal from './item-modal';
import { useToast } from '@/hooks/use-toast';

export default function ItemsTab() {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { inventory, loading: invLoading, error: invError } = useShelfInventory();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleOpenNew = () => {
    if (categories.length === 0) {
      toast({ title: 'Requires Category', description: 'Create a category first.', variant: 'destructive' });
      return;
    }
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (window.confirm(`Delete ${item.name}?`)) {
      try {
        await deleteMenuItem(item.id, item.pricingMode, item.tiers ? Object.keys(item.tiers) : []);
        toast({ title: 'Item deleted' });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    }
  };

  if (catError || itemsError || invError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0E0F12] rounded-xl border border-destructive/20">
        <AlertCircle className="w-10 h-10 text-destructive mb-4" />
        <p className="text-white font-bold mb-2">Error loading data</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="bg-[#14161B] text-white border-destructive/20 hover:bg-[#2A2D35]">
          Retry
        </Button>
      </div>
    );
  }

  if (catLoading || itemsLoading || invLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin stroke-[url(#flame-grad)]" /></div>;
  }

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Menu Items</h2>
        <Button onClick={handleOpenNew} className="bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white border-none rounded-xl active:scale-95 transition-all">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center p-12 bg-[#0E0F12] rounded-xl border border-[#FF6D00]/20 border-dashed">
          <p className="text-[#E2E8F0] mb-4">No menu items created yet.</p>
          <Button onClick={handleOpenNew} variant="outline" className="bg-[#14161B] text-white border-[#FF6D00]/20 hover:bg-[#2A2D35]">
            Create First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const isPiece = item.pricingMode === 'piece';
            return (
              <div key={item.id} className="bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10 flex flex-col gap-3 relative hover:border-[#FF6D00]/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className={`font-bold text-lg ${item.active ? 'text-white' : 'text-[#94A3B8] line-through'}`}>{item.name}</div>
                    <div className="text-xs text-[#FF6D00] font-medium tracking-wider uppercase">{getCategoryName(item.categoryId)}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)} className="h-8 w-8 text-[#94A3B8] hover:text-white">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-[#14161B] p-2 rounded-lg border border-[#2A2D35] text-sm">
                  {isPiece ? (
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Piece</span>
                      <span className="font-mono text-white">NPR {item.unitPrice?.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {Object.values(item.tiers || {}).map((tier: any, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-[#94A3B8]">{tier.label}</span>
                          <span className="font-mono text-white">NPR {tier.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          existingItem={editingItem}
          categories={categories}
          inventory={inventory}
        />
      )}
    </div>
  );
}