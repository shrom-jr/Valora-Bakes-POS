import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ExpenseRecord } from '@/lib/rtdb';
import { categoryLabel, fmtDateTime, formatNpr, paidFromLabel, staffName } from '@/lib/expense-display';

export default function ExpenseBreakdownDialog({
  open, onOpenChange, expenses, periodLabel,
}: { open: boolean; onOpenChange: (o: boolean) => void; expenses: ExpenseRecord[]; periodLabel: string }) {
  const { user } = useAuth();
  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const groups = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach((e) => m.set(e.category, (m.get(e.category) || 0) + e.amount));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl border border-white/10 bg-[#14161B] p-6 text-white shadow-2xl [&>button]:right-4 [&>button]:top-4 [&>button]:opacity-100">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl font-bold">Full Expense Breakdown</DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            {periodLabel} · Total Outflow: <span className="font-mono font-bold text-[#FFD54F]">{formatNpr(total)}</span>
          </DialogDescription>
        </DialogHeader>
        <section aria-label="Category share">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Category share</h3>
          <ul className="mt-2 divide-y divide-[#2A2D35] rounded-xl border border-[#2A2D35] bg-[#0E0F12]">
            {groups.map(([cat, sum]) => (
              <li key={cat} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="font-semibold">{categoryLabel[cat as keyof typeof categoryLabel] || 'Other'}</span>
                <span className="font-mono text-xs text-[#CBD5E1]">{formatNpr(sum)} ({total ? ((sum / total) * 100).toFixed(1) : '0.0'}%)</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Itemized log">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Itemized log</h3>
          <div className="mt-2 overflow-x-auto rounded-xl border border-[#2A2D35] bg-[#0E0F12]">
            <table className="w-full min-w-[620px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#FF6D00]/15 bg-[#14161B] text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                  <th scope="col" className="px-3 py-3">Date &amp; Time</th>
                  <th scope="col" className="px-3 py-3">Category</th>
                  <th scope="col" className="px-3 py-3">Note</th>
                  <th scope="col" className="px-3 py-3">Paid From</th>
                  <th scope="col" className="px-3 py-3">Recorded By</th>
                  <th scope="col" className="px-3 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D35] text-[#E2E8F0]">
                {expenses.map((e) => (
                  <tr key={`${e.dateKey}-${e.id}`}>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[#94A3B8]">{fmtDateTime(e.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{categoryLabel[e.category] || 'Other'}</td>
                    <td className="max-w-[160px] truncate px-3 py-2.5">{e.note || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{paidFromLabel[e.paidFrom] || e.paidFrom}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{staffName(e, user)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-bold text-[#FF8A65]">{formatNpr(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
