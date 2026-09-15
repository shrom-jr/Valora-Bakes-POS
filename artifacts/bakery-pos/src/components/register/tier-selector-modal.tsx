import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function TierSelectorModal({ isOpen, onClose, item, inventory, onSelect }: any) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#14161B] border-[#FF6D00]/20 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
          <DialogDescription className="text-[#94A3B8]">Select a weight tier</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
          {Object.keys(item.tiers || {}).map(tierId => {
            const tier = item.tiers[tierId];
            const invKey = `${item.id}__${tierId}`;
            const inv = inventory[invKey];
            const stockQty = inv?.availableQuantity || 0;
            const isOutOfStock = item.trackStock && stockQty <= 0;

            return (
              <button
                key={tierId}
                disabled={isOutOfStock}
                onClick={() => {
                  onSelect(tierId, tier);
                  onClose();
                }}
                className={`relative rounded-2xl p-[1px] text-left transition-all ${
                  isOutOfStock 
                    ? 'bg-[#2A2D35] opacity-50 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-[#FF6D00]/50 to-transparent hover:from-[#FFD54F] hover:via-[#FF6D00] hover:to-[#F4511E] shadow-[0_2px_10px_rgba(255,109,0,0.1)] hover:shadow-[0_4px_15px_rgba(255,109,0,0.3)] active:scale-95'
                }`}
              >
                <div className="bg-[#0E0F12] p-4 rounded-[15px] h-full flex flex-col gap-2">
                  <div className="text-lg font-bold text-white">{tier.label}</div>
                  <div className="font-mono text-[#E2E8F0]">NPR {tier.price.toFixed(2)}</div>
                  {item.trackStock && (
                    <div className={`text-xs font-mono font-bold mt-2 ${isOutOfStock ? 'text-destructive' : stockQty <= (inv?.lowStockLevel || 5) ? 'text-[#FFB300]' : 'text-[#10B981]'}`}>
                      {isOutOfStock ? 'Sold Out' : `${stockQty} in stock`}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}