import { database } from './firebase';
import { ref, push, update, remove, runTransaction } from 'firebase/database';

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MenuItemTier {
  label: string;
  weightLb: number | null;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  pricingMode: 'piece' | 'weight';
  unitPrice: number | null;
  tiers: Record<string, MenuItemTier> | null;
  trackStock: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ShelfInventory {
  id: string;
  itemId: string;
  tierId: string | null;
  availableQuantity: number;
  lowStockLevel: number;
  updatedAt: number;
}

export type SalePaymentMethod = 'cash' | 'qr';

export interface SaleItemInput {
  cartItemId: string;
  itemId: string;
  name: string;
  tierId: string | null;
  tierLabel: string | null;
  unitPrice: number;
  quantity: number;
}

export interface CompleteSaleInput {
  items: SaleItemInput[];
  discount?: {
    mode: 'flat' | 'percentage';
    value: number;
  };
  paymentMethod: SalePaymentMethod;
  cashReceived?: number;
  referenceId?: string;
  userId?: string | null;
}

export interface CompleteSaleResult {
  orderNumber: number;
  saleId: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  changeDue: number;
}

const roundCurrency = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

// Write Helpers
export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!database) throw new Error('Database not initialized');
  const catRef = ref(database, 'categories');
  const newRef = push(catRef);
  const now = Date.now();
  
  const updates: Record<string, any> = {};
  updates[`categories/${newRef.key}`] = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await update(ref(database), updates);
}

export async function updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) {
  if (!database) throw new Error('Database not initialized');
  const updates: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates[`categories/${id}/${key}`] = value;
    }
  });
  updates[`categories/${id}/updatedAt`] = Date.now();
  await update(ref(database), updates);
}

export async function swapCategorySortOrders(cat1Id: string, cat1Sort: number, cat2Id: string, cat2Sort: number) {
  if (!database) throw new Error('Database not initialized');
  const now = Date.now();
  const updates = {
    [`categories/${cat1Id}/sortOrder`]: cat2Sort,
    [`categories/${cat1Id}/updatedAt`]: now,
    [`categories/${cat2Id}/sortOrder`]: cat1Sort,
    [`categories/${cat2Id}/updatedAt`]: now,
  };
  await update(ref(database), updates);
}

export async function deleteCategory(id: string) {
  if (!database) throw new Error('Database not initialized');
  
  const result = await runTransaction(ref(database), (rootData) => {
    if (rootData === null) return rootData;
    const items = rootData.menuItems || {};
    const hasItems = Object.values(items).some((item: any) => item.categoryId === id);
    
    if (hasItems) {
      // Abort transaction to handle error securely on server-side
      return undefined;
    }
    
    if (rootData.categories && rootData.categories[id]) {
      delete rootData.categories[id];
    }
    return rootData;
  });

  if (!result.committed) {
    throw new Error("Cannot delete: Category is used by existing menu items.");
  }
}

export async function createMenuItem(data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>, initialInventory: Record<string, number>, lowStockLevel: number) {
  if (!database) throw new Error('Database not initialized');
  const itemsRef = ref(database, 'menuItems');
  const newRef = push(itemsRef);
  const itemId = newRef.key;
  if (!itemId) throw new Error('Failed to generate item ID');

  const now = Date.now();
  const itemData: Omit<MenuItem, 'id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const updates: Record<string, any> = {};
  updates[`menuItems/${itemId}`] = itemData;

  if (data.pricingMode === 'piece') {
    updates[`shelfInventory/${itemId}`] = {
      itemId,
      tierId: null,
      availableQuantity: initialInventory['piece'] || 0,
      lowStockLevel,
      updatedAt: now,
    };
  } else if (data.pricingMode === 'weight' && data.tiers) {
    Object.keys(data.tiers).forEach((tierId) => {
      updates[`shelfInventory/${itemId}__${tierId}`] = {
        itemId,
        tierId,
        availableQuantity: initialInventory[tierId] || 0,
        lowStockLevel,
        updatedAt: now,
      };
    });
  }

  await update(ref(database), updates);
}

export async function updateMenuItem(
  id: string, 
  data: Partial<Omit<MenuItem, 'id' | 'createdAt'>>, 
  inventoryOps?: {
    removeKeys: string[];
    addKeys: Record<string, { tierId: string | null; qty: number; lowStockLevel: number }>;
    updateKeys?: Record<string, { lowStockLevel: number }>;
    restockKeys?: Record<string, { amount: number; lowStockLevel: number }>;
  }
) {
  if (!database) throw new Error('Database not initialized');
  const result = await runTransaction(ref(database), (rootData) => {
    if (!rootData || !rootData.menuItems?.[id]) return undefined;

    const now = Date.now();
    const nextItem = { ...rootData.menuItems[id] };
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        nextItem[key] = value;
      }
    });
    nextItem.updatedAt = now;
    rootData.menuItems[id] = nextItem;

    rootData.shelfInventory ??= {};

    inventoryOps?.removeKeys?.forEach((key) => {
      delete rootData.shelfInventory[key];
    });

    for (const [key, details] of Object.entries(inventoryOps?.addKeys || {})) {
      rootData.shelfInventory[key] = {
        itemId: id,
        tierId: details.tierId,
        availableQuantity: details.qty,
        lowStockLevel: details.lowStockLevel,
        updatedAt: now,
      };
    }

    for (const [key, details] of Object.entries(inventoryOps?.updateKeys || {})) {
      const node = rootData.shelfInventory[key];
      if (!node || typeof node.availableQuantity !== 'number') return undefined;
      node.lowStockLevel = details.lowStockLevel;
      node.updatedAt = now;
    }

    for (const [key, details] of Object.entries(inventoryOps?.restockKeys || {})) {
      const node = rootData.shelfInventory[key];
      if (!node || typeof node.availableQuantity !== 'number') return undefined;
      node.availableQuantity += details.amount;
      node.lowStockLevel = details.lowStockLevel;
      node.updatedAt = now;
    }

    return rootData;
  });

  if (!result.committed) {
    throw new Error('Could not save the item and inventory changes. The item may have changed elsewhere.');
  }
}

export async function deleteMenuItem(id: string, pricingMode: 'piece' | 'weight', tierIds: string[]) {
  if (!database) throw new Error('Database not initialized');
  const updates: Record<string, any> = {};
  updates[`menuItems/${id}`] = null;
  
  if (pricingMode === 'piece') {
    updates[`shelfInventory/${id}`] = null;
  } else {
    tierIds.forEach(tierId => {
      updates[`shelfInventory/${id}__${tierId}`] = null;
    });
  }

  await update(ref(database), updates);
}

export async function addInventory(inventoryKey: string, amount: number) {
  if (!database) throw new Error('Database not initialized');
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  
  const invRef = ref(database, `shelfInventory/${inventoryKey}`);
  const result = await runTransaction(invRef, (currentData) => {
    if (currentData === null) {
      return undefined;
    }
    if (typeof currentData !== 'object' || typeof currentData.availableQuantity !== 'number') {
      return undefined;
    }
    
    currentData.availableQuantity += amount;
    currentData.updatedAt = Date.now();
    return currentData;
  });

  if (!result.committed) {
    throw new Error('Inventory node is missing or malformed');
  }
}

export async function completeSale(input: CompleteSaleInput): Promise<CompleteSaleResult> {
  if (!database) throw new Error('Database not initialized');
  if (!input.items.length) throw new Error('Cannot complete an empty sale');
  if (input.items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    throw new Error('Sale quantities must be positive whole numbers');
  }
  if (input.paymentMethod === 'cash' && (!Number.isFinite(input.cashReceived) || (input.cashReceived || 0) < 0)) {
    throw new Error('Cash received must be a valid amount');
  }

  const saleRef = push(ref(database, 'sales'));
  const saleId = saleRef.key;
  if (!saleId) throw new Error('Failed to generate sale ID');

  let failureReason = '';
  const result = await runTransaction(ref(database), (rootData) => {
    if (!rootData) {
      failureReason = 'The live register data is unavailable. Please try again.';
      return undefined;
    }

    const menuItems = rootData.menuItems || {};
    const shelfInventory = rootData.shelfInventory || {};
    const saleItems: Array<SaleItemInput & { lineTotal: number }> = [];
    let subtotal = 0;

    for (const cartItem of input.items) {
      const menuItem = menuItems[cartItem.itemId];
      if (!menuItem || !menuItem.active) {
        failureReason = `${cartItem.name} is no longer available on the register.`;
        return undefined;
      }

      const isPiece = menuItem.pricingMode === 'piece';
      const liveTier = !isPiece && cartItem.tierId ? menuItem.tiers?.[cartItem.tierId] : null;
      if (!isPiece && (!cartItem.tierId || !liveTier)) {
        failureReason = `${cartItem.name} weight tier is no longer available.`;
        return undefined;
      }

      const livePrice = isPiece ? menuItem.unitPrice : liveTier?.price;
      if (typeof livePrice !== 'number' || Math.abs(livePrice - cartItem.unitPrice) > 0.005) {
        failureReason = `${cartItem.name} changed price while this order was open. Review the cart and try again.`;
        return undefined;
      }

      const lineTotal = roundCurrency(livePrice * cartItem.quantity);
      subtotal = roundCurrency(subtotal + lineTotal);
      saleItems.push({
        ...cartItem,
        tierLabel: liveTier?.label ?? null,
        unitPrice: livePrice,
        lineTotal,
      });

      if (menuItem.trackStock) {
        const inventoryKey = isPiece ? cartItem.itemId : `${cartItem.itemId}__${cartItem.tierId}`;
        const stock = shelfInventory[inventoryKey];
        if (!stock || typeof stock.availableQuantity !== 'number') {
          failureReason = `${cartItem.name} is missing a live inventory record.`;
          return undefined;
        }
        if (stock.availableQuantity < cartItem.quantity) {
          failureReason = `Not enough stock for ${cartItem.name}${liveTier ? ` (${liveTier.label})` : ''}. Only ${stock.availableQuantity} remaining.`;
          return undefined;
        }
      }
    }

    const discountValue = Number(input.discount?.value || 0);
    const discountAmount = input.discount
      ? input.discount.mode === 'percentage'
        ? roundCurrency(subtotal * Math.min(100, Math.max(0, discountValue)) / 100)
        : roundCurrency(Math.min(subtotal, Math.max(0, discountValue)))
      : 0;
    const total = roundCurrency(Math.max(0, subtotal - discountAmount));
    const cashReceived = input.paymentMethod === 'cash' ? roundCurrency(input.cashReceived || 0) : 0;

    if (input.paymentMethod === 'cash' && cashReceived < total) {
      failureReason = `Cash received is short by NPR ${roundCurrency(total - cashReceived).toFixed(2)}.`;
      return undefined;
    }

    for (const cartItem of saleItems) {
      const menuItem = menuItems[cartItem.itemId];
      if (!menuItem.trackStock) continue;
      const inventoryKey = menuItem.pricingMode === 'piece'
        ? cartItem.itemId
        : `${cartItem.itemId}__${cartItem.tierId}`;
      const stock = shelfInventory[inventoryKey];
      stock.availableQuantity -= cartItem.quantity;
      stock.updatedAt = Date.now();
    }

    const orderNumber = Number(rootData.orderCounter || 0) + 1;
    rootData.orderCounter = orderNumber;
    rootData.sales ??= {};
    rootData.sales[saleId] = {
      orderNumber,
      items: saleItems,
      subtotal,
      discount: input.discount
        ? { mode: input.discount.mode, value: discountValue, amount: discountAmount }
        : null,
      total,
      paymentMethod: input.paymentMethod,
      cashReceived: input.paymentMethod === 'cash' ? cashReceived : null,
      changeDue: input.paymentMethod === 'cash' ? roundCurrency(cashReceived - total) : 0,
      referenceId: input.referenceId?.trim() || null,
      userId: input.userId || null,
      createdAt: Date.now(),
    };

    return rootData;
  });

  if (!result.committed) {
    throw new Error(failureReason || 'The sale could not be committed because the register changed. Please review the cart and try again.');
  }

  const savedSale = result.snapshot.val()?.sales?.[saleId];
  if (!savedSale) throw new Error('Sale committed without a readable receipt record');

  return {
    orderNumber: savedSale.orderNumber,
    saleId,
    subtotal: savedSale.subtotal,
    discountAmount: savedSale.discount?.amount || 0,
    total: savedSale.total,
    changeDue: savedSale.changeDue || 0,
  };
}

export async function updateInventory(inventoryKey: string, quantity: number, lowStockLevel: number) {
  if (!database) throw new Error('Database not initialized');
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Quantity must be a nonnegative integer');
  if (!Number.isInteger(lowStockLevel) || lowStockLevel < 0) throw new Error('Low stock level must be a nonnegative integer');

  const updates = {
    availableQuantity: quantity,
    lowStockLevel: lowStockLevel,
    updatedAt: Date.now()
  };
  await update(ref(database, `shelfInventory/${inventoryKey}`), updates);
}
