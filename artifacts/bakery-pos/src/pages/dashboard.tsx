import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Clock, ArrowRight, Loader2, Store, Plus, Minus, X, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories, useMenuItems, useShelfInventory, useStoreSettings } from '@/hooks/use-rtdb';
import { useCart, CartItem } from '@/hooks/use-cart';
import TierSelectorModal from '@/components/register/tier-selector-modal';
import DiscountControl from '@/components/register/discount-control';
import TenderModal from '@/components/register/tender-modal';
import { completeSale } from '@/lib/rtdb';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { ReceiptPayload } from '@/components/register/receipt-preview';

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const { user } = useAuth();
  const { categories, loading: catLoading, error: catError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { inventory, loading: invLoading, error: invError } = useShelfInventory();
  const { settings: storeSettings } = useStoreSettings();
  const { cart, addToCart, incrementQuantity, decrementQuantity, removeFromCart, clearCart, syncWithInventory } = useCart();
  const { toast } = useToast();

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItemForTier, setSelectedItemForTier] = useState<any | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountMode, setDiscountMode] = useState<'flat' | 'percentage'>('flat');
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ mode: 'flat' | 'percentage'; value: number } | null>(null);
  const [tenderOpen, setTenderOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [cashReceived, setCashReceived] = useState(0);
  const [referenceId, setReferenceId] = useState('');
  const [processingSale, setProcessingSale] = useState(false);
  const [tenderError, setTenderError] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptPayload | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClamp = useCallback((removedNames: string[]) => {
    toast({
      title: 'Cart Updated',
      description: `${removedNames.join(', ')} adjusted due to inventory changes.`,
    });
  }, [toast]);

  // Sync cart with inventory
  useEffect(() => {
    if (!invLoading && !itemsLoading) {
      const itemsMap = items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {} as Record<string, any>);
      syncWithInventory(inventory, itemsMap, handleClamp);
    }
  }, [inventory, itemsLoading, invLoading, items, syncWithInventory, handleClamp]);

  const activeCategories = useMemo(() => categories.filter(c => c.active), [categories]);
  
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategoryId) {
      setActiveCategoryId('all');
    }
  }, [activeCategories, activeCategoryId]);

  const displayedItems = useMemo(() => {
    if (!activeCategoryId) return [];
    const activeOnly = items.filter(i => i.active);
    if (activeCategoryId === 'all') return activeOnly;
    return activeOnly.filter(i => i.categoryId === activeCategoryId);
  }, [items, activeCategoryId]);

  const handleTileClick = (item: any) => {
    if (item.pricingMode === 'piece') {
      const invKey = item.id;
      const inv = inventory[invKey];
      const maxQty = item.trackStock ? (inv?.availableQuantity || 0) : null;
      if (item.trackStock && maxQty === 0) return; // Sold out

      addToCart({
        itemId: item.id,
        name: item.name,
        tierId: null,
        tierLabel: null,
        unitPrice: item.unitPrice,
        maxQuantity: maxQty,
      });
    } else {
      setSelectedItemForTier(item);
    }
  };

  const handleTierSelect = (tierId: string, tier: any) => {
    const item = selectedItemForTier;
    if (!item) return;
    const invKey = `${item.id}__${tierId}`;
    const inv = inventory[invKey];
    const maxQty = item.trackStock ? (inv?.availableQuantity || 0) : null;

    addToCart({
      itemId: item.id,
      name: item.name,
      tierId,
      tierLabel: tier.label,
      unitPrice: tier.price,
      maxQuantity: maxQty,
    });
    setSelectedItemForTier(null);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.mode === 'percentage') {
      return Math.min(subtotal, Math.max(0, subtotal * Math.min(100, Math.max(0, appliedDiscount.value)) / 100));
    }
    return Math.min(subtotal, Math.max(0, appliedDiscount.value));
  }, [appliedDiscount, subtotal]);
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyDiscount = () => {
    const value = Number(discountInput);
    if (!Number.isFinite(value) || value < 0) {
      toast({ title: 'Invalid discount', description: 'Enter a non-negative discount amount.', variant: 'destructive' });
      return;
    }
    const safeValue = discountMode === 'percentage'
      ? Math.min(100, value)
      : Math.min(subtotal, value);
    setAppliedDiscount({ mode: discountMode, value: safeValue });
    setDiscountInput(String(safeValue));
    setDiscountOpen(false);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput('');
    setDiscountOpen(false);
  };

  const handleOpenTender = () => {
    if (cart.length === 0 || processingSale) return;
    setTenderError('');
    setPaymentMethod('cash');
    setCashReceived(0);
    setReferenceId('');
    setCompletedReceipt(null);
    setTenderOpen(true);
  };

  const handleDoneReceipt = () => {
    setCompletedReceipt(null);
    setTenderOpen(false);
    clearCart();
    handleRemoveDiscount();
    setCashReceived(0);
    setReferenceId('');
  };

  const handleCompleteSale = async (method: 'cash' | 'qr') => {
    if (cart.length === 0 || processingSale) return;
    setTenderError('');
    setProcessingSale(true);
    try {
      const result = await completeSale({
        items: cart.map((item) => ({
          cartItemId: item.cartItemId,
          itemId: item.itemId,
          name: item.name,
          tierId: item.tierId,
          tierLabel: item.tierLabel,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        discount: appliedDiscount || undefined,
        paymentMethod: method,
        cashReceived: method === 'cash' ? cashReceived : undefined,
        referenceId: method === 'qr' ? referenceId : undefined,
        userId: user?.uid || null,
      });
      setCompletedReceipt({
        orderNumber: result.orderNumber,
        createdAt: Date.now(),
        cashierName: user?.displayName || user?.email || 'Counter Staff',
        items: cart.map((item) => ({
          name: item.name,
          tierLabel: item.tierLabel,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.unitPrice * item.quantity,
        })),
        subtotal,
        discountAmount,
        total: result.total,
        paymentMethod: method,
        cashReceived: method === 'cash' ? cashReceived : null,
        changeDue: result.changeDue,
      });
      toast({
        title: `Sale Completed — Order #${result.orderNumber}`,
        description: method === 'cash'
          ? `Change due: NPR ${result.changeDue.toFixed(2)}`
          : `QR payment recorded for NPR ${result.total.toFixed(2)}`,
      });
    } catch (err: any) {
      const message = err?.message || 'The sale could not be completed. The cart was kept intact.';
      setTenderError(message);
      toast({ title: 'Sale not completed', description: message, variant: 'destructive' });
    } finally {
      setProcessingSale(false);
    }
  };

  if (catError || itemsError || invError) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0E0F12]">
          <AlertCircle className="w-12 h-12 stroke-[url(#flame-grad)] mb-4" />
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Connection Error</h2>
          <p className="text-[#E2E8F0] max-w-md mx-auto leading-relaxed mb-6">
            Unable to connect to the realtime database. Please check your connection.
          </p>
          <Button onClick={() => window.location.reload()} className="bg-[#14161B] text-white border border-[#2A2D35] hover:bg-[#1A1D24]">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
          </Button>
        </div>
      </AppShell>
    );
  }

  if (catLoading || itemsLoading || invLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center bg-[#0E0F12]">
          <Loader2 className="w-8 h-8 animate-spin stroke-[url(#flame-grad)]" />
        </div>
      </AppShell>
    );
  }

  if (activeCategories.length === 0 || items.length === 0) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500 bg-[#0E0F12] relative z-10">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#FFD54F] via-[#FF6D00] to-transparent shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15),0_0_0_1px_rgba(255,140,0,0.25)] mb-6">
            <div className="w-20 h-20 rounded-2xl bg-[#14161B] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D00]/5 to-transparent opacity-50 rounded-2xl" />
              <Store className="w-8 h-8 stroke-[url(#flame-grad)] opacity-90" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome to {storeSettings.profile.bakeryName}</h2>
          <p className="text-[#E2E8F0] max-w-md mx-auto leading-relaxed mb-8">
            Your catalog is currently empty. Head over to the Menu workspace to set up your first categories and items.
          </p>
          <Link href="/dashboard/menu" className="h-12 px-6 bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] hover:from-[#FFD54F] hover:via-[#FF8A00] hover:to-[#E64A19] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(255,109,0,0.4)] flex items-center transition-all active:scale-95">
            Set Up First Menu Item
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col md:flex-row h-auto md:h-full overflow-y-auto md:overflow-hidden bg-[#0E0F12]">
        
        <div className="flex-1 flex flex-col min-h-[500px] md:h-full border-r border-[#FF6D00]/10 relative overflow-hidden z-10">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,109,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          {/* Category Ribbon */}
          <div className="p-4 border-b border-[#FF6D00]/10 flex gap-2 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
            <button
              onClick={() => setActiveCategoryId('all')}
              className={`shrink-0 rounded-xl h-12 px-6 font-bold tracking-wide transition-all active:scale-95 ${
                activeCategoryId === 'all' 
                  ? 'bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white shadow-[0_4px_15px_rgba(255,109,0,0.3)]' 
                  : 'bg-[#14161B] text-[#94A3B8] border border-[#2A2D35] hover:bg-[#1A1D24] hover:text-[#E2E8F0]'
              }`}
            >
              All Items
            </button>
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`shrink-0 rounded-xl h-12 px-6 font-bold tracking-wide transition-all active:scale-95 ${
                  activeCategoryId === cat.id
                    ? 'bg-gradient-to-r from-[#FFB300] to-[#F4511E] text-white shadow-[0_4px_15px_rgba(255,109,0,0.3)]' 
                    : 'bg-[#14161B] text-[#94A3B8] border border-[#2A2D35] hover:bg-[#1A1D24] hover:text-[#E2E8F0]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4 z-10 relative">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
              {displayedItems.map(item => {
                const isPiece = item.pricingMode === 'piece';
                let minPrice = 0;
                let stockStatus = 'Available';
                let stockClass = 'text-[#10B981] bg-[#10B981]/10';
                let isOutOfStock = false;
                
                if (isPiece) {
                  minPrice = item.unitPrice || 0;
                  if (item.trackStock) {
                    const currentQty = inventory[item.id]?.availableQuantity || 0;
                    if (currentQty <= 0) {
                      isOutOfStock = true;
                      stockStatus = 'Sold Out';
                      stockClass = 'text-destructive bg-destructive/10';
                    } else if (currentQty <= (inventory[item.id]?.lowStockLevel || 5)) {
                      stockStatus = `${currentQty} left`;
                      stockClass = 'text-[#FFB300] bg-[#FFB300]/10';
                    } else {
                      stockStatus = `${currentQty} in stock`;
                    }
                  } else {
                    stockStatus = 'Unlimited';
                  }
                } else {
                  if (item.tiers) {
                    minPrice = Math.min(...Object.values(item.tiers).map((t: any) => t.price));
                  }
                  if (item.trackStock) {
                    const allSoldOut = Object.keys(item.tiers || {}).every(tId => (inventory[`${item.id}__${tId}`]?.availableQuantity || 0) <= 0);
                    if (allSoldOut && Object.keys(item.tiers || {}).length > 0) {
                      isOutOfStock = true;
                      stockStatus = 'Sold Out';
                      stockClass = 'text-destructive bg-destructive/10';
                    } else {
                      stockStatus = 'Select Tier';
                    }
                  } else {
                    stockStatus = 'Unlimited';
                  }
                }

                let cartQty = 0;
                if (isPiece) {
                  const cartItem = cart.find(c => c.cartItemId === item.id);
                  if (cartItem) cartQty = cartItem.quantity;
                } else {
                  cartQty = cart.filter(c => c.itemId === item.id).reduce((acc, c) => acc + c.quantity, 0);
                }

                return (
                  <button
                    key={item.id}
                    disabled={isOutOfStock}
                    onClick={() => handleTileClick(item)}
                    className={`relative text-left h-[140px] rounded-2xl p-[1px] transition-all overflow-hidden ${
                      isOutOfStock 
                        ? 'bg-[#14161B] border border-[#2A2D35] opacity-60 cursor-not-allowed' 
                        : 'bg-gradient-to-br from-[#FF6D00]/30 to-transparent hover:from-[#FFD54F]/60 shadow-[0_2px_10px_rgba(255,109,0,0.1)] active:scale-95'
                    }`}
                  >
                    <div className="bg-[#14161B] rounded-[15px] h-full flex flex-col justify-between p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <div className="font-bold text-white leading-tight pr-8">{item.name}</div>
                      <div>
                        <div className="font-mono text-[#E2E8F0] mb-2">{!isPiece && <span className="text-xs text-[#94A3B8] font-sans mr-1">from</span>}NPR {minPrice.toFixed(2)}</div>
                        <div className={`inline-block px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${stockClass}`}>
                          {stockStatus}
                        </div>
                      </div>
                    </div>
                    {cartQty > 0 && (
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB300] to-[#F4511E] flex items-center justify-center text-white font-bold font-mono shadow-[0_0_10px_rgba(255,109,0,0.5)]">
                        {cartQty}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Order Sidebar */}
        <div className="w-full md:w-[380px] h-auto md:h-full flex flex-col shrink-0 relative shadow-[-8px_0_32px_rgba(0,0,0,0.5)] z-20 bg-[#14161B]">
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#FFD54F] via-[#FF6D00] to-transparent shadow-[0_0_15px_rgba(255,109,0,0.4)]" />
          <div className="md:hidden absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-[#FFD54F] via-[#FF6D00] to-transparent shadow-[0_0_15px_rgba(255,109,0,0.4)]" />
          
          <div className="h-14 border-b border-[#FF6D00]/10 flex items-center justify-between px-4 bg-[#14161B] shrink-0">
            <span className="font-bold text-white tracking-wide">Current Order</span>
            <div className="flex items-center gap-1.5 text-[#E2E8F0] text-sm font-mono">
              <Clock className="w-3.5 h-3.5 stroke-[url(#flame-grad)]" />
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-[#0E0F12] overflow-y-auto min-h-[250px]">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative rounded-full p-[1px] bg-gradient-to-br from-[#FF6D00]/50 to-transparent shadow-[0_2px_10px_rgba(255,109,0,0.1)] mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#14161B] flex items-center justify-center">
                    <FileText className="w-5 h-5 stroke-[url(#flame-grad)] opacity-80" />
                  </div>
                </div>
                <p className="text-sm text-[#E2E8F0]">Add items to begin an order</p>
              </div>
            ) : (
              <div className="flex-1 p-3 space-y-2">
                {cart.map(cartItem => (
                  <div key={cartItem.cartItemId} className="bg-[#14161B] p-3 rounded-xl border border-[#2A2D35] flex items-center justify-between group">
                    <div className="flex-1 flex flex-col min-w-0 pr-2">
                      <span className="text-white font-bold truncate">{cartItem.name}</span>
                      <div className="flex items-center gap-2">
                        {cartItem.tierLabel && <span className="text-xs text-[#FFB300] bg-[#FFB300]/10 px-1.5 rounded">{cartItem.tierLabel}</span>}
                        <span className="text-sm font-mono text-[#94A3B8]">NPR {cartItem.unitPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8] hover:text-white hover:bg-[#2A2D35]" onClick={() => decrementQuantity(cartItem.cartItemId)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono font-bold text-white w-6 text-center">{cartItem.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8] hover:text-white hover:bg-[#2A2D35]" onClick={() => incrementQuantity(cartItem.cartItemId)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 ml-1" onClick={() => removeFromCart(cartItem.cartItemId)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-[#14161B] shrink-0 space-y-4 relative z-10 border-t border-[#FF6D00]/10">
            <div className="mb-4 border-b border-[#FF6D00]/10 pb-4">
              <DiscountControl
                open={discountOpen}
                onOpenChange={setDiscountOpen}
                discountMode={discountMode}
                onDiscountModeChange={setDiscountMode}
                inputValue={discountInput}
                onInputValueChange={setDiscountInput}
                appliedAmount={discountAmount}
                subtotal={subtotal}
                onApply={handleApplyDiscount}
                onRemove={handleRemoveDiscount}
                disabled={cart.length === 0 || processingSale}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[#E2E8F0] font-mono">
                <span className="font-sans">Subtotal</span>
                <span>NPR {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm font-mono text-[#6EE7B7]">
                  <span className="font-sans">Discount</span>
                  <span>- NPR {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#E2E8F0] font-mono">
                <span className="font-sans">Tax (0%)</span>
                <span>NPR 0.00</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-[#FF6D00]/40 to-transparent my-3" />
              <div className="flex justify-between items-end pb-2">
                <span className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">Total</span>
                <span className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">NPR {total.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              disabled={cart.length === 0 || processingSale}
              onClick={handleOpenTender}
              className="w-full h-14 text-lg font-bold tracking-wide bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] text-white border-transparent opacity-100 rounded-xl shadow-[0_0_20px_rgba(255,109,0,0.4),0_8px_16px_rgba(0,0,0,0.4)] disabled:opacity-60 transition-all hover:scale-[0.98] hover:shadow-[0_0_25px_rgba(255,109,0,0.6),0_10px_20px_rgba(0,0,0,0.5)] active:scale-95"
            >
              Charge <span className="font-mono ml-2">NPR {total.toFixed(2)}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
        
      </div>
      
      <TierSelectorModal 
        isOpen={!!selectedItemForTier} 
        onClose={() => setSelectedItemForTier(null)} 
        item={selectedItemForTier}
        inventory={inventory}
        onSelect={handleTierSelect}
      />
      <TenderModal
        open={tenderOpen}
        onOpenChange={(open) => {
          if (!processingSale) {
            if (!open && completedReceipt) {
              handleDoneReceipt();
            } else {
              setTenderOpen(open);
              if (!open) setTenderError('');
            }
          }
        }}
        total={total}
        cashReceived={cashReceived}
        onCashReceivedChange={setCashReceived}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={(method) => {
          setTenderError('');
          setPaymentMethod(method);
        }}
        referenceId={referenceId}
        onReferenceIdChange={setReferenceId}
        onExactCash={() => setCashReceived(total)}
        onCompleteCash={() => void handleCompleteSale('cash')}
        onConfirmQr={() => void handleCompleteSale('qr')}
        processing={processingSale}
        errorMessage={tenderError}
        completedReceipt={completedReceipt}
        storeProfile={storeSettings.profile}
        receiptWidth={storeSettings.receipt.width}
        onDoneReceipt={handleDoneReceipt}
      />
    </AppShell>
  );
}