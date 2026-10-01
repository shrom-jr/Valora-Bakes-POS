import { AlertCircle, ReceiptText } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useExpensesInRange } from '@/hooks/use-rtdb';
import { categoryLabel, fmtTime, formatNpr, initials, paidFromLabel, staffName } from '@/lib/expense-display';

export default function TodayExpensesPanel({ dateKey }: { dateKey: string }) {
  const { user } = useAuth();
  const { expenses, loading, error } = useExpensesInRange(dateKey, dateKey);
  return (
    <section className="min-w-0 rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5" aria-label="Today's expenses">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">AUDIT TRAIL</p>
          <h2 className="mt-2 text-xl font-bold text-white">
            Today&apos;s Expenses <span className="font-mono text-base text-[#FFD54F]" data-testid="text-expense-count">({expenses.length})</span>
          </h2>
        </div>
        <ReceiptText className="h-5 w-5 text-[#FFD54F]" />
      </div>
      {error ? (
        <div role="alert" className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#F4511E]/30 bg-[#0E0F12]/70 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-[#F4511E]" />
          <p className="mt-3 text-sm font-bold text-white">Expenses could not be loaded</p>
        </div>
      ) : loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[#0E0F12]" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#FF6D00]/20 bg-[#0E0F12]/70 px-6 py-10 text-center">
          <ReceiptText className="h-8 w-8 text-[#64748B]" />
          <h3 className="mt-3 text-sm font-bold text-white">No expenses recorded today.</h3>
        </div>
      ) : (
        <div className="dashboard-scrollbar overflow-x-auto rounded-xl border border-[#2A2D35] bg-[#0E0F12]">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Today&apos;s expenses</caption>
            <thead>
              <tr className="border-b border-[#FF6D00]/15 bg-[#14161B] text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                <th scope="col" className="px-3 py-3">Time</th>
                <th scope="col" className="px-3 py-3">Category</th>
                <th scope="col" className="px-3 py-3">Note</th>
                <th scope="col" className="px-3 py-3">Paid From</th>
                <th scope="col" className="px-3 py-3">Logged By</th>
                <th scope="col" className="px-3 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D35]">
              {expenses.map((e) => {
                const name = staffName(e, user);
                return (
                  <tr key={e.id} className="text-sm text-[#E2E8F0]" data-testid={`row-expense-${e.id}`}>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-[#94A3B8]">{fmtTime(e.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="rounded-full border border-[#FFB300]/25 bg-[#FFB300]/10 px-2.5 py-1 text-[10px] font-bold text-[#FFD54F]">{categoryLabel[e.category] || 'Other'}</span>
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-3 text-xs" title={e.note || undefined}>{e.note || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-[#CBD5E1]">{paidFromLabel[e.paidFrom] || e.paidFrom}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs">
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6D00]/15 text-[10px] font-bold text-[#FFB300]">{initials(name)}</span>
                        {name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-sm font-bold text-[#FF8A65]">-{formatNpr(e.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
