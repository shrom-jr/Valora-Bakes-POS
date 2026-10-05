import { useEffect, useState } from 'react';
import { endAt, onValue, orderByKey, query, ref, startAt } from 'firebase/database';
import { database } from '@/lib/firebase';
import {
  Category,
  DailySummary,
  defaultStoreSettings,
  ExpenseCategory,
  ExpensePaidFrom,
  ExpenseRecord,
  getDateKey,
  MenuItem,
  normalizeVatSettings,
  SaleRecord,
  ShelfInventory,
  StoreSettings,
} from '@/lib/rtdb';

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

export function useAllSales() {
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
  }, []);

  return { sales, loading, error };
}

export function useDailySummaries(startDateKey: string, endDateKey: string) {
  const [summaries, setSummaries] = useState<Record<string, DailySummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const summariesRef = ref(database, 'dailySummaries');
    const unsubscribe = onValue(
      summariesRef,
      (snapshot) => {
        setError(null);
        const value = snapshot.val() || {};
        const parsed: Record<string, DailySummary> = {};
        Object.entries(value).forEach(([dateKey, data]) => {
          if (dateKey >= startDateKey && dateKey <= endDateKey) {
            parsed[dateKey] = {
              totalSales: Number((data as Partial<DailySummary>).totalSales) || 0,
              orderCount: Number((data as Partial<DailySummary>).orderCount) || 0,
              cashInflow: Number((data as Partial<DailySummary>).cashInflow) || 0,
              digitalInflow: Number((data as Partial<DailySummary>).digitalInflow) || 0,
              totalExpenses: Number((data as Partial<DailySummary>).totalExpenses) || 0,
              cashDrawerExpenses: Number((data as Partial<DailySummary>).cashDrawerExpenses) || 0,
              physicalCashToTally: Number((data as Partial<DailySummary>).physicalCashToTally) || 0,
              netProfit: Number((data as Partial<DailySummary>).netProfit) || 0,
              updatedAt: Number((data as Partial<DailySummary>).updatedAt) || 0,
            };
          }
        });
        setSummaries(parsed);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [startDateKey, endDateKey]);

  return { summaries, loading, error };
}

export function useExpensesInRange(startDateKey: string, endDateKey: string) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!database || startDateKey > endDateKey) {
      setExpenses([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const expenseQuery = startDateKey === endDateKey
      ? ref(database, `expenses/${startDateKey}`)
      : query(
          ref(database, 'expenses'),
          orderByKey(),
          startAt(startDateKey),
          endAt(endDateKey),
        );
    const unsubscribe = onValue(
      expenseQuery,
      (snapshot) => {
        if (!active) return;
        const value = snapshot.val() as Record<string, unknown> | null;
        const buckets = startDateKey === endDateKey
          ? { [startDateKey]: value }
          : value || {};
        const parsed = Object.entries(buckets || {}).flatMap(([dateKey, rawBucket]) => {
          if (!rawBucket || typeof rawBucket !== 'object') return [];
          return Object.entries(rawBucket as Record<string, unknown>).flatMap(([key, rawExpense]) => {
            if (!rawExpense || typeof rawExpense !== 'object') return [];
            const record = rawExpense as Partial<ExpenseRecord>;
            const userId = record.userId || record.createdBy || null;
            const createdBy = record.createdBy || record.userId || null;
            return [{
              id: record.id || key,
              dateKey: record.dateKey || dateKey,
              amount: Number(record.amount) || 0,
              category: (record.category || 'other') as ExpenseCategory,
              paidFrom: (record.paidFrom || 'cashDrawer') as ExpensePaidFrom,
              note: record.note || null,
              createdAt: Number(record.createdAt) || 0,
              createdBy,
              createdByName: record.createdByName || null,
              userId,
            }];
          });
        });
        parsed.sort((a, b) => b.createdAt - a.createdAt);
        setExpenses(parsed);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(err);
        setLoading(false);
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [startDateKey, endDateKey]);

  return { expenses, loading, error };
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const settingsRef = ref(database, 'settings');
    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        setError(null);
        const value = snapshot.val() || {};
        const profile = value.profile || {};
        setSettings({
          profile: {
            ...defaultStoreSettings.profile,
            ...profile,
          },
          features: {
            ...defaultStoreSettings.features,
            ...(value.features || {}),
          },
          receipt: {
            ...defaultStoreSettings.receipt,
            ...(value.receipt || {}),
          },
          vat: normalizeVatSettings(value.vat),
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { settings, loading, error };
}
