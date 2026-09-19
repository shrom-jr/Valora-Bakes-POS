import React, { useMemo } from 'react';
import { AlertCircle, Banknote, BarChart3, Boxes, CreditCard, Loader2, PackageSearch, ReceiptText, Sparkles } from 'lucide-react';
import { useCategories, useMenuItems, useShelfInventory } from '@/hooks/use-rtdb';
import { AppShell } from '@/components/layout/app-shell';
import DashboardShell from '@/components/layout/dashboard-shell';

const formatNpr = (amount: number) => `NPR ${amount.toFixed(2)}`;

function KpiCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: React.ElementType; tone: string }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.2)]">
      <div className={`absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent ${tone} to-transparent`} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">{label}</p>
        <Icon className="h-5 w-5 text-[#FFD54F]" />
      </div>
      <p className="mt-5 font-mono text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-[#64748B]">{detail}</p>
    </article>
  );
}

export default function DashboardOverview() {
  const { categories, loading: categoriesLoading } = useCategories();
  const { items, loading: itemsLoading } = useMenuItems();
  const { inventory, loading: inventoryLoading } = useShelfInventory();

  const stockAlerts = useMemo(() => {
    const alerts: { itemName: string; tierLabel: string; quantity: number; threshold: number }[] = [];

    items.forEach((item) => {
      if (!item.trackStock) return;
      if (item.pricingMode === 'piece') {
        const stock = inventory[item.id];
        if (stock && stock.availableQuantity <= stock.lowStockLevel) {
          alerts.push({ itemName: item.name, tierLabel: 'Per piece', quantity: stock.availableQuantity, threshold: stock.lowStockLevel });
        }
        return;
      }

      Object.entries(item.tiers || {}).forEach(([tierId, tier]) => {
        const stock = inventory[`${item.id}__${tierId}`];
        if (stock && stock.availableQuantity <= stock.lowStockLevel) {
          alerts.push({ itemName: item.name, tierLabel: tier.label, quantity: stock.availableQuantity, threshold: stock.lowStockLevel });
        }
      });
    });

    return alerts;
  }, [inventory, items]);

  const isLoading = categoriesLoading || itemsLoading || inventoryLoading;

  return (
    <AppShell>
      <DashboardShell>
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-[#0E0F12]">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6D00]" />
          </div>
        ) : (
          <div className="min-h-full bg-[#0E0F12]">
            <main className="mx-auto w-full max-w-6xl space-y-6">
              <header className="mb-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB300]">Daily control room</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Overview</h1>
                <p className="mt-2 text-sm text-[#94A3B8]">A clear view of today&apos;s register activity and shelf readiness.</p>
              </header>

              <section aria-label="Daily KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Today&apos;s Sales" value={formatNpr(0)} detail="0 settled bills today" icon={ReceiptText} tone="via-[#FFD54F]" />
                <KpiCard label="Cash Inflow" value={formatNpr(0)} detail="No cash settlements recorded" icon={Banknote} tone="via-[#FFB300]" />
                <KpiCard label="Digital / QR Inflow" value={formatNpr(0)} detail="No digital settlements recorded" icon={CreditCard} tone="via-[#FF6D00]" />
                <KpiCard label="Stock Alerts" value={String(stockAlerts.length)} detail={`${items.length} catalog items · ${categories.length} categories`} icon={PackageSearch} tone="via-[#F4511E]" />
              </section>

              <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Today&apos;s Settlement Details</p>
                      <h2 className="mt-2 text-xl font-bold text-white">Register activity</h2>
                    </div>
                    <BarChart3 className="h-5 w-5 text-[#FFD54F]" />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-4">
                      <p className="text-xs text-[#64748B]">Average ticket size</p>
                      <p className="mt-2 font-mono text-lg font-bold text-white">{formatNpr(0)}</p>
                    </div>
                    <div className="rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-4">
                      <p className="text-xs text-[#64748B]">Cash / QR split</p>
                      <p className="mt-2 font-mono text-lg font-bold text-white">0% / 0%</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-dashed border-[#FF6D00]/20 bg-[#0E0F12]/70 p-5 text-center">
                    <Sparkles className="mx-auto h-5 w-5 text-[#FFB300]" />
                    <p className="mt-2 text-sm font-semibold text-[#E2E8F0]">No settled bills yet</p>
                    <p className="mt-1 text-xs text-[#64748B]">Settlement metrics will appear after checkout is enabled.</p>
                  </div>
                </article>

                <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Top Selling Bakes</p>
                      <h2 className="mt-2 text-xl font-bold text-white">Today&apos;s leaders</h2>
                    </div>
                    <Boxes className="h-5 w-5 text-[#FFD54F]" />
                  </div>
                  <div className="mt-6 rounded-xl border border-dashed border-[#FF6D00]/20 bg-[#0E0F12]/70 p-8 text-center">
                    <AlertCircle className="mx-auto h-5 w-5 text-[#64748B]" />
                    <p className="mt-2 text-sm font-semibold text-[#E2E8F0]">No sales data yet</p>
                    <p className="mt-1 text-xs text-[#64748B]">Best sellers will populate when transactions are recorded.</p>
                  </div>
                </article>
              </section>

              <section className="mt-6 rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Shelf readiness</p>
                    <h2 className="mt-2 text-xl font-bold text-white">Stock alerts</h2>
                  </div>
                  <PackageSearch className="h-5 w-5 text-[#FFD54F]" />
                </div>
                {stockAlerts.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-4 text-sm text-[#6EE7B7]">
                    All tracked products are above their low-stock threshold.
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {stockAlerts.slice(0, 9).map((alert) => (
                      <div key={`${alert.itemName}-${alert.tierLabel}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#F4511E]/20 bg-[#0E0F12] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{alert.itemName}</p>
                          <p className="mt-1 text-xs text-[#94A3B8]">{alert.tierLabel} · threshold {alert.threshold}</p>
                        </div>
                        <span className={`shrink-0 font-mono text-sm font-bold ${alert.quantity <= 0 ? 'text-[#FF8A65]' : 'text-[#FFD54F]'}`}>{alert.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        )}
      </DashboardShell>
    </AppShell>
  );
}