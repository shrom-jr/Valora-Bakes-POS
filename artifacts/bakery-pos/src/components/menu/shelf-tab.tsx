import React, { useState } from 'react';
import { useCategories, useMenuItems, useShelfInventory } from '@/hooks/use-rtdb';
import { addInventory } from '@/lib/rtdb';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function ShelfTab() {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { inventory, loading: invLoading, error: invError } = useShelfInventory();
  const { toast } = useToast();

  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  
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

  if (itemsLoading || invLoading || catLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin stroke-[url(#flame-grad)]" /></div>;
  }

  const handleAddStock = async (invKey: string, amount: number) => {
    if (amount <= 0 || isNaN(amount)) return;
    setProcessing(prev => ({ ...prev, [invKey]: true }));
    try {
      await addInventory(invKey, amount);
      toast({ title: 'Stock added', description: `Added ${amount} to shelf` });
      setCustomAmounts(prev => ({ ...prev, [invKey]: '' }));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setProcessing(prev => ({ ...prev, [invKey]: false }));
  };

  const activeCategories = categories.filter(c => c.active);
  const activeItems = items.filter(i => i.active);

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Shelf Loading</h2>
        <p className="text-sm text-[#94A3B8]">Quickly add fresh bake to the shelf inventory.</p>
      </div>

      {activeCategories.map(cat => {
        const catItems = activeItems.filter(i => i.categoryId === cat.id);
        if (catItems.length === 0) return null;

        return (
          <div key={cat.id} className="space-y-4">
            <h3 className="text-lg font-bold text-[#FFB300] border-b border-[#FF6D00]/20 pb-2">{cat.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catItems.map(item => {
                if (!item.trackStock) {
                  return (
                    <div key={item.id} className="bg-[#0E0F12] p-4 rounded-xl border border-[#2A2D35] flex justify-between items-center opacity-70">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[#94A3B8] text-sm uppercase tracking-wider font-mono">Unlimited</span>
                    </div>
                  );
                }

                if (item.pricingMode === 'piece') {
                  const invKey = item.id;
                  const currentQty = inventory[invKey]?.availableQuantity || 0;
                  const isLow = currentQty <= (inventory[invKey]?.lowStockLevel || 5);
                  const isProc = processing[invKey];

                  return (
                    <div key={invKey} className="bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10 hover:border-[#FF6D00]/30 transition-colors space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-lg">{item.name}</span>
                        <div className={`px-2 py-1 rounded text-sm font-mono font-bold ${isLow ? 'bg-destructive/20 text-destructive' : 'bg-[#10B981]/20 text-[#10B981]'}`}>
                          {currentQty} in stock
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button disabled={isProc} size="sm" variant="outline" className="bg-[#14161B] text-white border-[#2A2D35] hover:bg-[#2A2D35] flex-1" onClick={() => handleAddStock(invKey, 1)}>+1</Button>
                        <Button disabled={isProc} size="sm" variant="outline" className="bg-[#14161B] text-white border-[#2A2D35] hover:bg-[#2A2D35] flex-1" onClick={() => handleAddStock(invKey, 5)}>+5</Button>
                        <Button disabled={isProc} size="sm" variant="outline" className="bg-[#14161B] text-white border-[#2A2D35] hover:bg-[#2A2D35] flex-1" onClick={() => handleAddStock(invKey, 10)}>+10</Button>
                        <div className="flex w-24">
                          <Input 
                            placeholder="Qty" 
                            type="number" 
                            value={customAmounts[invKey] || ''} 
                            onChange={e => setCustomAmounts(prev => ({ ...prev, [invKey]: e.target.value }))}
                            className="bg-[#14161B] border-[#2A2D35] h-8 rounded-r-none focus-visible:ring-0 text-center font-mono text-white" 
                          />
                          <Button disabled={isProc} size="sm" className="h-8 rounded-l-none bg-[#FF6D00] hover:bg-[#F4511E] text-white px-2" onClick={() => handleAddStock(invKey, parseInt(customAmounts[invKey] || '0'))}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return Object.keys(item.tiers || {}).map(tierId => {
                    const tier = item.tiers![tierId];
                    const invKey = `${item.id}__${tierId}`;
                    const currentQty = inventory[invKey]?.availableQuantity || 0;
                    const isLow = currentQty <= (inventory[invKey]?.lowStockLevel || 5);
                    const isProc = processing[invKey];

                    return (
                      <div key={invKey} className="bg-[#0E0F12] p-4 rounded-xl border border-[#FF6D00]/10 hover:border-[#FF6D00]/30 transition-colors space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{item.name}</span>
                            <span className="text-[#94A3B8] text-sm">{tier.label}</span>
                          </div>
                          <div className={`px-2 py-1 rounded text-sm font-mono font-bold ${isLow ? 'bg-destructive/20 text-destructive' : 'bg-[#10B981]/20 text-[#10B981]'}`}>
                            {currentQty} in stock
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button disabled={isProc} size="sm" variant="outline" className="bg-[#14161B] text-white border-[#2A2D35] hover:bg-[#2A2D35] flex-1" onClick={() => handleAddStock(invKey, 1)}>+1</Button>
                          <Button disabled={isProc} size="sm" variant="outline" className="bg-[#14161B] text-white border-[#2A2D35] hover:bg-[#2A2D35] flex-1" onClick={() => handleAddStock(invKey, 5)}>+5</Button>
                          <Button disabled={isProc} size="sm" variant="outline" className="bg-[#14161B] text-white border-[#2A2D35] hover:bg-[#2A2D35] flex-1" onClick={() => handleAddStock(invKey, 10)}>+10</Button>
                          <div className="flex w-24">
                            <Input 
                              placeholder="Qty" 
                              type="number" 
                              value={customAmounts[invKey] || ''} 
                              onChange={e => setCustomAmounts(prev => ({ ...prev, [invKey]: e.target.value }))}
                              className="bg-[#14161B] border-[#2A2D35] h-8 rounded-r-none focus-visible:ring-0 text-center font-mono text-white" 
                            />
                            <Button disabled={isProc} size="sm" className="h-8 rounded-l-none bg-[#FF6D00] hover:bg-[#F4511E] text-white px-2" onClick={() => handleAddStock(invKey, parseInt(customAmounts[invKey] || '0'))}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                }
              })}
            </div>
          </div>
        );
      })}

      {activeCategories.length === 0 && (
        <div className="text-center p-12 bg-[#0E0F12] rounded-xl border border-[#2A2D35] border-dashed">
          <p className="text-[#E2E8F0]">No active categories to display.</p>
        </div>
      )}
    </div>
  );
}