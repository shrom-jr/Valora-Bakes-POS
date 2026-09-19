import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Category, DailySummary, getDateKey, MenuItem, SaleRecord, ShelfInventory } from '@/lib/rtdb';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const catRef = ref(database, 'categories');
    const unsubscribe = onValue(
      catRef,
      (snapshot) => {
        setError(null);
        const val = snapshot.val();
        if (val) {
          const cats = Object.entries(val).map(([id, data]) => ({
            id,
            ...(data as Omit<Category, 'id'>),
          }));
          cats.sort((a, b) => a.sortOrder - b.sortOrder);
          setCategories(cats);
        } else {
          setCategories([]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { categories, loading, error };
}

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const itemsRef = ref(database, 'menuItems');
    const unsubscribe = onValue(
      itemsRef,
      (snapshot) => {
        setError(null);
        const val = snapshot.val();
        if (val) {
          const parsed = Object.entries(val).map(([id, data]) => ({
            id,
            ...(data as Omit<MenuItem, 'id'>),
          }));
          setItems(parsed);
        } else {
          setItems([]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { items, loading, error };
}

export function useShelfInventory() {
  const [inventory, setInventory] = useState<Record<string, ShelfInventory>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const invRef = ref(database, 'shelfInventory');
    const unsubscribe = onValue(
      invRef,
      (snapshot) => {
        setError(null);
        const val = snapshot.val();
        if (val) {
          const parsed: Record<string, ShelfInventory> = {};
          Object.entries(val).forEach(([id, data]) => {
            parsed[id] = { id, ...(data as Omit<ShelfInventory, 'id'>) };
          });
          setInventory(parsed);
        } else {
          setInventory({});
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { inventory, loading, error };
}

export function useDailySummary(dateKey = getDateKey()) {
  const [summary, setSummary] = useState<DailySummary>(() => ({
    totalSales: 0,
    orderCount: 0,
    cashInflow: 0,
    digitalInflow: 0,
    totalExpenses: 0,
    cashDrawerExpenses: 0,
    physicalCashToTally: 0,
    netProfit: 0,
    updatedAt: 0,
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const summaryRef = ref(database, `dailySummaries/${dateKey}`);
    const unsubscribe = onValue(
      summaryRef,
      (snapshot) => {
        setError(null);
        const value = snapshot.val() as Partial<DailySummary> | null;
        setSummary({
          totalSales: value?.totalSales || 0,
          orderCount: value?.orderCount || 0,
          cashInflow: value?.cashInflow || 0,
          digitalInflow: value?.digitalInflow || 0,
          totalExpenses: value?.totalExpenses || 0,
          cashDrawerExpenses: value?.cashDrawerExpenses || 0,
          physicalCashToTally: value?.physicalCashToTally || 0,
          netProfit: value?.netProfit || 0,
          updatedAt: value?.updatedAt || 0,
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [dateKey]);

  return { summary, loading, error };
}

export function useTodaySales(dateKey = getDateKey()) {
  const [sales, setSales] = useState<Array<SaleRecord & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const salesRef = ref(database, 'sales');
    const unsubscribe = onValue(
      salesRef,
      (snapshot) => {
        setError(null);
        const value = snapshot.val();
        const parsed = value
          ? Object.entries(value)
            .map(([id, data]) => ({ id, ...(data as SaleRecord) }))
            .filter((sale) => sale.dateKey === dateKey || (!sale.dateKey && getDateKey(new Date(sale.createdAt)) === dateKey))
            .sort((a, b) => b.createdAt - a.createdAt)
          : [];
        setSales(parsed);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [dateKey]);

  return { sales, loading, error };
}
