import type { ExpenseCategory, ExpensePaidFrom, ExpenseRecord } from '@/lib/rtdb';

export const categoryLabel: Record<ExpenseCategory, string> = {
  dairy: 'Dairy / Milk',
  packaging: 'Packaging',
  kitchen: 'Kitchen',
  utilities: 'Utilities',
  other: 'Other',
};
export const paidFromLabel: Record<ExpensePaidFrom, string> = {
  cash: 'Cash Drawer',
  cashDrawer: 'Cash Drawer',
  bankPersonal: 'Bank / Personal',
};
export const formatNpr = (n: number) => `NPR ${n.toFixed(2)}`;
const toDate = (t: number) => new Date(t < 1_000_000_000_000 ? t * 1000 : t);
export const fmtTime = (t: number) => toDate(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = (t: number) =>
  `${toDate(t).toLocaleDateString([], { month: 'short', day: '2-digit' })}, ${fmtTime(t)}`;

export function staffName(
  e: ExpenseRecord,
  user: { uid?: string; displayName?: string | null; email?: string | null } | null | undefined,
) {
  if (e.createdByName?.trim()) return e.createdByName.trim();
  const uid = e.userId || e.createdBy;
  if (user && uid && uid === user.uid) {
    const n = user.displayName?.trim() || user.email?.split('@')[0]?.trim();
    if (n) return n;
  }
  return 'Staff';
}
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'S';
