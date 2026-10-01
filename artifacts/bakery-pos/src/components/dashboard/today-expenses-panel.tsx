import { AlertCircle, ReceiptText } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useExpensesInRange } from '@/hooks/use-rtdb';
import { categoryLabel, fmtTime, formatNpr, paidFromLabel, staffName } from '@/lib/expense-display';

export default function TodayExpensesPanel({ dateKey }: { dateKey: string }) {
  const { user } = useAuth();
  const { expenses, loading, error } = useExpensesInRange(dateKey, dateKey);
  return (
    <section className="min-w-0 rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5" aria-label="Today's expenses">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">AUDIT TRAIL</p>
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
          <ReceiptText className="h-8 w-8 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-white">No expenses recorded today.</h3>
        </div>
      ) : (
        <div className="w-full min-w-0 rounded-xl border border-[#2A2D35] bg-[#0E0F12]">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">Today&apos;s expenses</caption>
            <colgroup>
              <col className="w-[35%] sm:w-[40%]" />
              <col className="w-[35%]" />
              <col className="w-[30%] sm:w-[25%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#FF6D00]/15 bg-[#14161B] text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                <th scope="col" className="px-1.5 py-3 sm:px-3">Expense</th>
                <th scope="col" className="px-1.5 py-3 sm:px-3">Source &amp; Time</th>
                <th scope="col" className="px-1.5 py-3 text-right sm:px-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D35]">
              {expenses.map((e) => {
                const name = staffName(e, user);
                return (
                  <tr key={e.id} className="text-sm text-[#E2E8F0]" data-testid={`row-expense-${e.id}`}>
                    <td className="min-w-0 px-1.5 py-3 align-top sm:px-3">
                      <span className="inline-block max-w-full whitespace-normal break-words rounded-full border border-[#FFB300]/25 bg-[#FFB300]/10 px-2 py-1 text-[10px] font-bold leading-tight text-[#FFD54F] sm:px-2.5">
                        {categoryLabel[e.category] || 'Other'}
                      </span>
                      <p className="mt-1.5 break-words text-xs font-medium text-slate-200">
                        {e.note ? `Note: ${e.note}` : 'Note: None'}
                      </p>
                    </td>
                    <td className="min-w-0 px-1.5 py-3 align-top sm:px-3">
                      <p className="break-words text-xs font-medium leading-4 text-slate-200">
                        {paidFromLabel[e.paidFrom] || e.paidFrom} · {name}
                      </p>
                      <p className="mt-1.5 font-mono text-xs font-medium text-slate-200">{fmtTime(e.createdAt)}</p>
                    </td>
                    <td className="whitespace-nowrap px-1.5 py-3 text-right align-top font-mono text-[10px] font-bold tabular-nums text-[#FF8A65] sm:px-3 sm:text-[11px] xl:text-sm">
                      -{formatNpr(e.amount)}
                    </td>
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
