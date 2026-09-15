import React, { useState, useMemo } from 'react';
import { useCategories, useMenuItems, useShelfInventory } from '@/hooks/use-rtdb';
import { swapCategorySortOrders, deleteCategory, deleteMenuItem, addInventory, MenuItem, Category, ShelfInventory } from '@/lib/rtdb';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Plus, Edit2, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import UnifiedItemEditor from './unified-item-editor';
import UnifiedCategoryEditor from './unified-category-editor';

const RestockRow = ({ label, price, item, tierId, inventory }: { label: string, price: number, item: MenuItem, tierId: string | null, inventory: Record<string, ShelfInventory> }) => {
  const invKey = tierId ? `${item.id}__${tierId}` : item.id;
  const currentQty = inventory[invKey]?.availableQuantity || 0;
  const lowStockLevel = inventory[invKey]?.lowStockLevel || 5;
  const isSoldOut = currentQty <= 0;
  const isLow = currentQty > 0 && currentQty <= lowStockLevel;
  
  const [customAdd, setCustomAdd] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleAdd = async (amount: number) => {
    if (!Number.isInteger(amount) || amount <= 0) {
      toast({ title: 'Validation', description: 'Restock amount must be a positive integer', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    try {
      await addInventory(invKey, amount);
      toast({ title: `Added ${amount} to ${item.name} (${label})` });
      setCustomAdd('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end gap-2">
        <div className="min-w-0">
          <div className="text-sm text-[#E2E8F0] font-medium truncate">{label}</div>
          <div className="text-[11px] font-mono text-[#94A3B8]">NPR {price?.toFixed(2)}</div>
        </div>
        {item.trackStock ? (
          <div className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap font-mono font-bold border shrink-0 ${isSoldOut ? 'bg-destructive/10 text-destructive border-destructive/20' : isLow ? 'bg-[#FFB300]/10 text-[#FFB300] border-[#FFB300]/20' : 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'}`}>
            {isSoldOut ? 'SOLD OUT' : `${currentQty} IN STOCK`}
          </div>
        ) : (
          <div className="px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap font-mono font-bold bg-[#2A2D35] text-[#94A3B8] border border-[#2A2D35] shrink-0">
            UNLIMITED
          </div>
        )}
      </div>

      {item.trackStock && (
        <div className="flex items-center gap-1 mt-1">
          <Button aria-label={`Restock ${label} by 1`} disabled={processing} size="sm" variant="outline" onClick={() => handleAdd(1)} className="h-9 px-0 flex-1 bg-[#0E0F12] border-[#2A2D35] hover:border-[#FF6D00]/50 hover:text-[#FF6D00] text-xs">+1</Button>
          <Button aria-label={`Restock ${label} by 5`} disabled={processing} size="sm" variant="outline" onClick={() => handleAdd(5)} className="h-9 px-0 flex-1 bg-[#0E0F12] border-[#2A2D35] hover:border-[#FF6D00]/50 hover:text-[#FF6D00] text-xs">+5</Button>
          <Button aria-label={`Restock ${label} by 10`} disabled={processing} size="sm" variant="outline" onClick={() => handleAdd(10)} className="h-9 px-0 flex-1 bg-[#0E0F12] border-[#2A2D35] hover:border-[#FF6D00]/50 hover:text-[#FF6D00] text-xs">+10</Button>
          <div className="flex w-[68px] shrink-0">
            <Input 
              type="number"
              min="1"
              step="1"
              aria-label={`Custom restock amount for ${label}`}
              value={customAdd}
              onChange={e => setCustomAdd(e.target.value)}
              disabled={processing}
              className="h-11 px-1 text-center font-mono text-xs rounded-r-none border-[#2A2D35] bg-[#0E0F12] focus-visible:ring-1 focus-visible:ring-[#FF6D00]"
              placeholder="#"
            />
            <Button aria-label={`Add custom restock for ${label}`} disabled={processing} size="sm" onClick={() => handleAdd(Number(customAdd || '0'))} className="h-9 px-1.5 rounded-l-none bg-[#FF6D00] hover:bg-[#F4511E] text-white">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
};

export default function UnifiedMenuWorkspace() {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { inventory, loading: invLoading, error: invError } = useShelfInventory();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter(i => i.categoryId === selectedCategory);
  }, [items, selectedCategory]);

  const maxCatSortOrder = useMemo(() => {
    return categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) : 0;
  }, [categories]);

  const handleOpenAddItem = () => {
    if (categories.length === 0) {
      toast({ title: 'Requires Category', description: 'Create a category first.', variant: 'destructive' });
      return;
    }
    setEditingItem(null);
    setIsItemEditorOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsItemEditorOpen(true);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (window.confirm(`Delete ${item.name}?`)) {
      try {
        await deleteMenuItem(item.id, item.pricingMode, item.tiers ? Object.keys(item.tiers) : []);
        toast({ title: 'Item deleted' });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    }
  };

  const handleOpenAddCat = () => {
    setEditingCategory(null);
    setIsCategoryEditorOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryEditorOpen(true);
  };

  const handleMoveCat = async (index: number, dir: number) => {
    const targetIndex = index + dir;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[index];
    const target = categories[targetIndex];
    try {
      await swapCategorySortOrders(current.id, current.sortOrder, target.id, target.sortOrder);
    } catch (err: any) {
      toast({ title: 'Error moving category', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteCat = async (cat: Category) => {
    const hasItems = items.some(i => i.categoryId === cat.id);
    if (hasItems) {
      toast({ title: 'Cannot delete', description: 'Category is used by existing menu items.', variant: 'destructive' });
      return;
    }
    if (window.confirm(`Delete category ${cat.name}?`)) {
      try {
        await deleteCategory(cat.id);
        toast({ title: 'Category deleted' });
        if (selectedCategory === cat.id) setSelectedCategory('all');
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    }
  };

  if (catError || itemsError || invError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-[#0E0F12]">
        <AlertCircle className="w-10 h-10 text-destructive mb-4" />
        <p className="text-white font-bold mb-2">Error loading workspace</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="bg-[#14161B] text-white border-destructive/20 hover:bg-[#2A2D35]">
          Retry
        </Button>
      </div>
    );
  }

  if (catLoading || itemsLoading || invLoading) {
    return <div className="flex h-full items-center justify-center bg-[#0E0F12]"><Loader2 className="w-8 h-8 animate-spin text-[#FF6D00]" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#0E0F12]">
      <div className="p-4 md:p-6 border-b border-[#FF6D00]/20 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Menu & Prices</h1>
        <p className="text-[#E2E8F0]">Manage catalog, prices, and shelf inventory in real time.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto p-4 shrink-0 border-b border-[#FF6D00]/10 no-scrollbar relative z-10 bg-[#14161B]/50 backdrop-blur-sm shadow-md">
         <Button 
           variant={selectedCategory === 'all' ? 'default' : 'outline'} 
           onClick={() => setSelectedCategory('all')}
           className={selectedCategory === 'all' ? 'bg-[#FF6D00] text-white hover:bg-[#F4511E] border-none' : 'bg-[#14161B] text-[#94A3B8] border-[#2A2D35] hover:text-white'}
         >
           All Items
         </Button>
         {categories.map((cat, i) => (
           <div key={cat.id} className={`flex items-center rounded-md border ${selectedCategory === cat.id ? 'border-[#FF6D00] bg-[#FF6D00]/10' : 'border-[#2A2D35] bg-[#14161B]'}`}>
             <button 
               onClick={() => setSelectedCategory(cat.id)}
               className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'text-white' : cat.active ? 'text-[#94A3B8] hover:text-white' : 'text-[#94A3B8]/50 line-through hover:text-[#94A3B8]'}`}
             >
               {cat.name}
             </button>
             {selectedCategory === cat.id && (
               <div className="flex items-center px-1 gap-1 border-l border-[#FF6D00]/20">
                  <button aria-label={`Move ${cat.name} left`} onClick={() => handleMoveCat(i, -1)} disabled={i === 0} className="min-h-11 min-w-11 p-1.5 text-[#FFD54F] hover:bg-[#FFD54F]/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowLeft className="w-3.5 h-3.5"/></button>
                  <button aria-label={`Move ${cat.name} right`} onClick={() => handleMoveCat(i, 1)} disabled={i === categories.length - 1} className="min-h-11 min-w-11 p-1.5 text-[#FFD54F] hover:bg-[#FFD54F]/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowRight className="w-3.5 h-3.5"/></button>
                  <button aria-label={`Edit ${cat.name}`} onClick={() => handleOpenEditCat(cat)} className="min-h-11 min-w-11 p-1.5 text-[#FFD54F] hover:bg-[#FFD54F]/10 rounded"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button aria-label={`Delete ${cat.name}`} onClick={() => handleDeleteCat(cat)} className="min-h-11 min-w-11 p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
               </div>
             )}
           </div>
         ))}
         <Button variant="outline" onClick={handleOpenAddCat} className="bg-[#14161B] text-[#FFB300] border-[#FFB300]/20 hover:bg-[#FFB300]/10 whitespace-nowrap ml-2">
           <Plus className="w-4 h-4 mr-2" /> Add Category
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          
          <button
             type="button"
            onClick={handleOpenAddItem}
             className="border-2 border-dashed border-[#FF6D00]/30 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-[#FF6D00] hover:bg-[#FF6D00]/5 transition-all min-h-[160px] group text-left"
          >
            <div className="bg-[#FF6D00]/20 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-[#FFB300]" />
            </div>
            <span className="text-white font-bold">Add Menu Item</span>
            <span className="text-[#94A3B8] text-sm text-center mt-1">Create a new item in {selectedCategory === 'all' ? 'the catalog' : categories.find(c=>c.id===selectedCategory)?.name}</span>
          </button>

          {filteredItems.map(item => {
            const isPiece = item.pricingMode === 'piece';
            const isActive = item.active;
            const cat = categories.find(c => c.id === item.categoryId);
            
            return (
              <div key={item.id} className={`bg-[#14161B] border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${isActive ? 'border-[#FF6D00]/20 shadow-[0_4px_15px_-3px_rgba(255,109,0,0.05)] hover:border-[#FF6D00]/50 hover:shadow-[0_4px_20px_-3px_rgba(255,109,0,0.1)]' : 'border-[#2A2D35] opacity-75'}`}>
                <div className="p-3 border-b border-[#2A2D35] bg-[#0E0F12] flex justify-between items-start gap-2 relative">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-base truncate ${isActive ? 'text-white' : 'text-[#94A3B8] line-through'}`}>{item.name}</span>
                      {!isActive && <span className="text-[9px] uppercase tracking-wider bg-[#2A2D35] text-[#94A3B8] px-1.5 py-0.5 rounded">Inactive</span>}
                    </div>
                    <div className="text-[11px] font-mono text-[#FFB300] uppercase tracking-wider truncate">
                      {cat?.name || 'Unknown'} • {isPiece ? 'Per Piece' : 'By Weight'}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 bg-[#0E0F12] pl-2">
                    <Button aria-label={`Edit ${item.name}`} variant="ghost" size="icon" onClick={() => handleOpenEditItem(item)} className="h-11 w-11 text-[#94A3B8] hover:text-white hover:bg-[#2A2D35]"><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button aria-label={`Delete ${item.name}`} variant="ghost" size="icon" onClick={() => handleDeleteItem(item)} className="h-11 w-11 text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col gap-3">
                  {isPiece ? (
                    <RestockRow 
                      label="Piece" 
                      price={item.unitPrice || 0} 
                      item={item} 
                      tierId={null} 
                      inventory={inventory} 
                    />
                  ) : (
                    Object.entries(item.tiers || {}).map(([tierId, tier]) => (
                      <RestockRow 
                        key={tierId}
                        label={tier.label}
                        price={tier.price}
                        item={item}
                        tierId={tierId}
                        inventory={inventory}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <UnifiedItemEditor 
        isOpen={isItemEditorOpen} 
        onClose={() => setIsItemEditorOpen(false)} 
        existingItem={editingItem} 
        categories={categories}
        inventory={inventory}
        defaultCategoryId={selectedCategory === 'all' ? categories.find((category) => category.active)?.id : selectedCategory}
      />
      
      <UnifiedCategoryEditor
        isOpen={isCategoryEditorOpen}
        onClose={() => setIsCategoryEditorOpen(false)}
        existingCategory={editingCategory}
        maxSortOrder={maxCatSortOrder}
      />
    </div>
  );
}