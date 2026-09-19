import React, { useMemo, useState } from 'react';
import { AlertCircle, BarChart3, Boxes, Loader2, RefreshCw, TrendingDown, Trophy } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import DashboardShell from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { useDailySummaries, useAllSales, useMenuItems } from '@/hooks/use-rtdb';
import { getDateKey, SaleRecord } from '@/lib/rtdb';

type ReportRange = 'today' | 'yesterday' | 'week' | 'month';

const formatNpr = (amount: number) => `NPR ${amount.toFixed(2)}`;
const rangeOptions: Array<{ value: ReportRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

function dateRange(range: ReportRange) {
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'yesterday') {
    const yesterday = new Date(current);
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: getDateKey(yesterday), end: getDateKey(yesterday) };
  }
  if (range === 'week') {
    const monday = new Date(current);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return { start: getDateKey(monday), end: getDateKey(current) };
  }
  if (range === 'month') {
    return {
      start: getDateKey(new Date(current.getFullYear(), current.getMonth(), 1)),
      end: getDateKey(current),
    };
  }
  return { start: getDateKey(current), end: getDateKey(current) };
}

function saleDateKey(sale: SaleRecord) {
  return sale.dateKey || getDateKey(new Date(sale.createdAt));
}

function ReportKpi({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl border border-[#FF6D00]/15 bg-[#14161B] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <div className={`absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent ${tone} to-transparent`} />
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.13em] text-[#CBD5E1]">{label}</p>
      <p className="mt-3 truncate font-mono text-xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[#64748B]">{detail}</p>
    </article>
  );
}

export default function Reports() {
  const [range, setRange] = useState<ReportRange>('today');
  const selectedRange = useMemo(() => dateRange(range), [range]);
  const { sales, loading: salesLoading, error: salesError } = useAllSales();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { summaries, loading: summariesLoading, error: summariesError } = useDailySummaries(selectedRange.start, selectedRange.end);

  const filteredSales = useMemo(
    () => sales.filter((sale) => {
      const key = saleDateKey(sale);
      return key >= selectedRange.start && key <= selectedRange.end && sale.status !== 'VOIDED';
    }),
    [sales, selectedRange],
  );

  const metrics = useMemo(() => {
    const summaryRows = Object.values(summaries);
    const hasSummaryData = summaryRows.length > 0;
    const sales = hasSummaryData
      ? summaryRows.reduce((total, summary) => total + summary.totalSales, 0)
      : filteredSales.reduce((total, sale) => total + sale.total, 0);
    const bills = hasSummaryData
      ? summaryRows.reduce((total, summary) => total + summary.orderCount, 0)
      : filteredSales.length;
    const outflow = summaryRows.reduce((total, summary) => total + summary.totalExpenses, 0);
    return {
      sales,
      bills,
      outflow,
      net: sales - outflow,
      average: bills ? sales / bills : 0,
    };
  }, [filteredSales, summaries]);

  const topSellers = useMemo(() => {
    const byItem = new Map<string, { name: string; quantity: number; revenue: number }>();
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = `${item.itemId}__${item.tierId || 'piece'}`;
        const existing = byItem.get(key) || {
          name: `${item.name}${item.tierLabel ? ` · ${item.tierLabel}` : ''}`,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal;
        byItem.set(key, existing);
      });
    });
    return Array.from(byItem.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  const slowMoving = useMemo(() => {
    const soldByKey = new Map<string, { quantity: number; revenue: number }>();
    filteredSales.forEach((sale) => sale.items.forEach((item) => {
      const key = `${item.itemId}__${item.tierId || 'piece'}`;
      const existing = soldByKey.get(key) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.lineTotal;
      soldByKey.set(key, existing);
    }));

    const rows: Array<{ name: string; quantity: number; revenue: number }> = [];
    items.filter((item) => item.active).forEach((item) => {
      if (item.pricingMode === 'piece') {
        const sold = soldByKey.get(`${item.id}__piece`) || { quantity: 0, revenue: 0 };
        rows.push({ name: item.name, ...sold });
      } else {
        Object.entries(item.tiers || {}).forEach(([tierId, tier]) => {
          const sold = soldByKey.get(`${item.id}__${tierId}`) || { quantity: 0, revenue: 0 };
          rows.push({ name: `${item.name} · ${tier.label}`, ...sold });
        });
      }
    });
    return rows.sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue).slice(0, 5);
  }, [filteredSales, items]);

  const isLoading = salesLoading || itemsLoading || summariesLoading;
  const error = salesError || itemsError || summariesError;

  return (
    <AppShell>
      <DashboardShell>
        {error ? (
          <div className="flex min-h-full flex-col items-center justify-center bg-[#0E0F12] p-8 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-[#F4511E]" />
            <p className="font-bold text-white">Unable to load sales reports</p>
            <p className="mt-2 max-w-md text-sm text-[#94A3B8]">The selected sales or daily summary records could not be read.</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-5 border-[#F4511E]/25 bg-[#14161B] text-white hover:bg-[#2A2D35]">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex min-h-full items-center justify-center bg-[#0E0F12]">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6D00]" />
          </div>
        ) : (
          <div className="min-h-full bg-[#0E0F12]">
            <main className="mx-auto w-full max-w-6xl space-y-6">
              <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB300]">Performance intelligence</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Sales Reports</h1>
                  <p className="mt-2 text-sm text-[#94A3B8]">Revenue, outflow, and product movement for the selected period.</p>
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Report date range">
                  {rangeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRange(option.value)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-bold transition ${
                        range === option.value
                          ? 'border-[#FFB300]/60 bg-[#FFB300]/15 text-[#FFD54F] shadow-[0_0_16px_rgba(255,179,0,0.12)]'
                          : 'border-[#2A2D35] bg-[#14161B] text-[#94A3B8] hover:border-[#FF6D00]/45 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </header>

              <section aria-label="Report performance summary" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                <ReportKpi label="Total Revenue" value={formatNpr(metrics.sales)} detail={`${selectedRange.start} → ${selectedRange.end}`} tone="via-[#FFD54F]" />
                <ReportKpi label="Settled Bills" value={String(metrics.bills)} detail="Completed orders" tone="via-[#FFB300]" />
                <ReportKpi label="Average Ticket" value={formatNpr(metrics.average)} detail="Average spend per bill" tone="via-[#FF6D00]" />
                <ReportKpi label="Total Outflow" value={formatNpr(metrics.outflow)} detail="Recorded shop expenses" tone="via-[#F4511E]" />
                <ReportKpi label="Net Margin" value={formatNpr(metrics.net)} detail={metrics.net >= 0 ? 'Revenue minus outflow' : 'Negative period margin'} tone={metrics.net >= 0 ? 'via-[#10B981]' : 'via-[#F4511E]'} />
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Revenue contribution</p>
                      <h2 className="mt-2 text-xl font-bold text-white">Top 5 Best Sellers</h2>
                    </div>
                    <Trophy className="h-5 w-5 text-[#FFD54F]" />
                  </div>
                  {topSellers.length === 0 ? (
                    <EmptyReport text="No completed item sales in this period." />
                  ) : (
                    <div className="mt-5 space-y-2">
                      {topSellers.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3 rounded-xl border border-[#2A2D35] bg-[#0E0F12] px-3 py-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFB300]/15 font-mono text-sm font-bold text-[#FFD54F]">{index + 1}</span>
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{item.name}</p>
                          <div className="shrink-0 text-right">
                            <p className="font-mono text-xs font-bold text-white">{item.quantity} sold</p>
                            <p className="mt-1 font-mono text-[10px] text-[#94A3B8]">{formatNpr(item.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Waste watch</p>
                      <h2 className="mt-2 text-xl font-bold text-white">Slow-Moving Inventory</h2>
                    </div>
                    <TrendingDown className="h-5 w-5 text-[#FF8A65]" />
                  </div>
                  {slowMoving.length === 0 ? (
                    <EmptyReport text="No active menu items are available for comparison." />
                  ) : (
                    <div className="mt-5 space-y-2">
                      {slowMoving.map((item) => (
                        <div key={item.name} className="flex items-center gap-3 rounded-xl border border-[#2A2D35] bg-[#0E0F12] px-3 py-3">
                          <Boxes className="h-4 w-4 shrink-0 text-[#FF8A65]" />
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{item.name}</p>
                          <div className="shrink-0 text-right">
                            <p className="font-mono text-xs font-bold text-[#FFD54F]">{item.quantity} sold</p>
                            <p className="mt-1 font-mono text-[10px] text-[#94A3B8]">{formatNpr(item.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>
            </main>
          </div>
        )}
      </DashboardShell>
    </AppShell>
  );
}

function EmptyReport({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-[#FF6D00]/20 bg-[#0E0F12]/70 p-8 text-center">
      <BarChart3 className="mx-auto h-5 w-5 text-[#64748B]" />
      <p className="mt-2 text-sm font-semibold text-[#E2E8F0]">{text}</p>
    </div>
  );
}