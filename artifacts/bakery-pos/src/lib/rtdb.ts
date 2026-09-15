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
  }
) {
  if (!database) throw new Error('Database not initialized');
  const now = Date.now();
  const updates: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates[`menuItems/${id}/${key}`] = value;
    }
  });
  
  if (data.tiers === null) {
    updates[`menuItems/${id}/tiers`] = null;
  }
  
  updates[`menuItems/${id}/updatedAt`] = now;

  if (inventoryOps?.removeKeys) {
    inventoryOps.removeKeys.forEach(key => {
      updates[`shelfInventory/${key}`] = null;
    });
  }

  if (inventoryOps?.addKeys) {
    Object.entries(inventoryOps.addKeys).forEach(([key, details]) => {
      updates[`shelfInventory/${key}`] = {
        itemId: id,
        tierId: details.tierId,
        availableQuantity: details.qty,
        lowStockLevel: details.lowStockLevel,
        updatedAt: now,
      };
    });
  }

  await update(ref(database), updates);
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
