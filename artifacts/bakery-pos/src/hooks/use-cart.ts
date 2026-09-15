import { useState, useCallback } from 'react';
import { MenuItem } from '@/lib/rtdb';

export interface CartItem {
  cartItemId: string; // Unique id for cart item, usually itemId or itemId__tierId
  itemId: string;
  name: string;
  tierId: string | null;
  tierLabel: string | null;
  unitPrice: number;
  quantity: number;
  maxQuantity: number | null; // null if unlimited (trackStock=false)
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity' | 'cartItemId'>) => {
    setCart((prev) => {
      const cartItemId = item.tierId ? `${item.itemId}__${item.tierId}` : item.itemId;
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        if (existing.maxQuantity !== null && existing.quantity >= existing.maxQuantity) {
          return prev;
        }
        return prev.map((i) => 
          i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (item.maxQuantity !== null && item.maxQuantity <= 0) return prev;
      return [...prev, { ...item, cartItemId, quantity: 1 }];
    });
  }, []);

  const incrementQuantity = useCallback((cartItemId: string) => {
    setCart((prev) => 
      prev.map((i) => {
        if (i.cartItemId === cartItemId) {
          if (i.maxQuantity !== null && i.quantity >= i.maxQuantity) return i;
          return { ...i, quantity: i.quantity + 1 };
        }
        return i;
      })
    );
  }, []);

  const decrementQuantity = useCallback((cartItemId: string) => {
    setCart((prev) => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing && existing.quantity === 1) {
        return prev.filter(i => i.cartItemId !== cartItemId);
      }
      return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter(i => i.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const syncWithInventory = useCallback((
    inventory: Record<string, { availableQuantity: number }>, 
    itemsMap: Record<string, MenuItem>,
    onClamp?: (removedNames: string[]) => void
  ) => {
    setCart((prev) => {
      let changed = false;
      const removedNames: string[] = [];
      
      const next = prev.map(cartItem => {
        const liveItem = itemsMap[cartItem.itemId];
        
        // Remove if deleted or inactive
        if (!liveItem || !liveItem.active) {
          changed = true;
          removedNames.push(cartItem.name);
          return null;
        }

        let livePrice = 0;
        let liveTierLabel = cartItem.tierLabel;
        
        if (liveItem.pricingMode === 'piece') {
          if (cartItem.tierId !== null) {
            changed = true;
            removedNames.push(cartItem.name);
            return null; // Pricing mode changed to piece, but cart item has tier
          }
          if (liveItem.unitPrice === null || liveItem.unitPrice < 0) {
            changed = true;
            removedNames.push(cartItem.name);
            return null;
          }
          livePrice = liveItem.unitPrice;
        } else {
          if (cartItem.tierId === null) {
            changed = true;
            removedNames.push(cartItem.name);
            return null; // Pricing mode changed to weight, but cart item has no tier
          }
          const liveTier = liveItem.tiers?.[cartItem.tierId];
          if (!liveTier || liveTier.price < 0) {
            changed = true;
            removedNames.push(cartItem.name);
            return null; // Tier removed or invalid
          }
          livePrice = liveTier.price;
          liveTierLabel = liveTier.label;
        }

        let maxQuantity = null;
        if (liveItem.trackStock) {
          const inv = inventory[cartItem.cartItemId];
          maxQuantity = inv ? Math.max(0, inv.availableQuantity) : 0;
        }

        let newQuantity = cartItem.quantity;
        if (maxQuantity !== null && newQuantity > maxQuantity) {
          newQuantity = maxQuantity;
          changed = true;
          if (newQuantity === 0) {
            removedNames.push(cartItem.name);
          }
        }

        if (
          cartItem.name !== liveItem.name ||
          cartItem.unitPrice !== livePrice ||
          cartItem.tierLabel !== liveTierLabel ||
          cartItem.maxQuantity !== maxQuantity
        ) {
          changed = true;
        }

        return {
          ...cartItem,
          name: liveItem.name,
          unitPrice: livePrice,
          tierLabel: liveTierLabel,
          quantity: newQuantity,
          maxQuantity,
        };
      }).filter((item): item is CartItem => item !== null && item.quantity > 0);

      if (changed) {
        if (removedNames.length > 0 && onClamp) {
          onClamp(Array.from(new Set(removedNames)));
        }
        return next;
      }
      return prev;
    });
  }, []);

  return {
    cart,
    addToCart,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    clearCart,
    syncWithInventory
  };
}
