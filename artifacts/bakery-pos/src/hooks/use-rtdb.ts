import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Category, MenuItem, ShelfInventory } from '@/lib/rtdb';

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
