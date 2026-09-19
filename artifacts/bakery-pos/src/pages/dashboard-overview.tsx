import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Loader2,
  PackageSearch,
  Plus,
  ReceiptText,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import DashboardShell from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import {
  addExpense,
  ExpenseCategory,
  ExpensePaidFrom,
  getDateKey,
  voidSale,
} from '@/lib/rtdb';
import {
  useCategories,
  useDailySummary,
  useMenuItems,
  useShelfInventory,
  useTodaySales,
} from '@/hooks/use-rtdb';
import ExpenseModal from '@/components/dashboard/expense-modal';
import TodayBillsTable, { TodayBill } from '@/components/dashboard/today-bills-table';
import { useToast } from '@/hooks/use-toast';

const formatNpr = (amount: number) => `NPR ${amount.toFixed(2)}`;

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  action,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone: string;
  action?: React.ReactNode;
}) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl border border-[#FF6D00]/15 bg-[#14161B] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <div className={`absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent ${tone} to-transparent`} />
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.13em] text-[#CBD5E1]">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-[#FFD54F]" />
      </div>
      <p className="mt-2 font-mono text-xl font-bold tracking-tight text-white">{value}</p>
      <div className="mt-1 flex min-h-7 items-center justify-between gap-2">
        <p className="truncate text-[11px] text-[#64748B]">{detail}</p>
        {action}
      </div>
    </article>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const dateKey = getDateKey();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { inventory, loading: inventoryLoading, error: inventoryError } = useShelfInventory();
  const { summary, loading: summaryLoading, error: summaryError } = useDailySummary(dateKey);
  const { sales, loading: salesLoading, error: salesError } = useTodaySales(dateKey);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('other');
  const [expensePaidFrom, setExpensePaidFrom] = useState<ExpensePaidFrom>('cashDrawer');
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseProcessing, setExpenseProcessing] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [voidingSaleId, setVoidingSaleId] = useState<string | null>(null);

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

  const bills = useMemo<TodayBill[]>(
    () => sales.map((sale) => ({
      saleId: sale.id,
      orderNumber: sale.orderNumber,
      createdAt: sale.createdAt,
      itemsSummary: sale.items
        .map((item) => `${item.name}${item.tierLabel ? ` · ${item.tierLabel}` : ''} ×${item.quantity}`)
        .join(', '),
      paymentMethod: sale.paymentMethod,
      total: sale.total,
      status: sale.status || 'COMPLETED',
    })),
    [sales],
  );

  const isLoading = categoriesLoading || itemsLoading || inventoryLoading || summaryLoading || salesLoading;
  const error = categoriesError || itemsError || inventoryError || summaryError || salesError;

  const openExpenseModal = () => {
    setExpenseError('');
    setExpenseAmount('');
    setExpenseCategory('other');
    setExpensePaidFrom('cashDrawer');
    setExpenseNote('');
    setExpenseOpen(true);
  };

  const handleAddExpense = async () => {
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseError('Enter an expense amount greater than zero.');
      return;
    }

    setExpenseProcessing(true);
    setExpenseError('');
    try {
      await addExpense({
        dateKey,
        amount,
        category: expenseCategory,
        paidFrom: expensePaidFrom,
        note: expenseNote,
        userId: user?.uid || null,
      });
      setExpenseOpen(false);
      toast({ title: 'Expense recorded', description: `${formatNpr(amount)} added to today’s expenses.` });
    } catch (err: any) {
      const message = err?.message || 'The expense could not be saved.';
      setExpenseError(message);
      toast({ title: 'Expense not saved', description: message, variant: 'destructive' });
    } finally {
      setExpenseProcessing(false);
    }
  };

  const handleVoidBill = async (bill: TodayBill) => {
    const confirmed = window.confirm(`Void Bill #${bill.orderNumber}? Stock will be returned to shelf.`);
    if (!confirmed || voidingSaleId) return;

    setVoidingSaleId(bill.saleId);
    try {
      const result = await voidSale(bill.saleId, user?.uid || null);
      toast({
        title: `Bill #${result.orderNumber} voided`,
        description: 'Stock and today’s financial summary were adjusted atomically.',
      });
    } catch (err: any) {
      toast({
        title: 'Bill not voided',
        description: err?.message || 'The bill could not be voided.',
        variant: 'destructive',
      });
    } finally {
      setVoidingSaleId(null);
    }
  };

  return (
    <AppShell>
      <DashboardShell>
        {error ? (
          <div className="flex min-h-full flex-col items-center justify-center bg-[#0E0F12] p-8 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-[#F4511E]" />
            <p className="font-bold text-white">Unable to load today&apos;s control room</p>
            <p className="mt-2 max-w-md text-sm text-[#94A3B8]">The live summary or register records could not be read.</p>
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
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB300]">Daily control room · {dateKey}</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Overview</h1>
                  <p className="mt-2 text-sm text-[#94A3B8]">Live sales, cash position, expenses, and bill audit for today.</p>
                </div>
                <Button
                  type="button"
                  onClick={openExpenseModal}
                  className="min-h-11 border-none bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] font-bold text-white shadow-[0_0_22px_rgba(255,109,0,0.22)] hover:brightness-110"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
              </header>

              <section aria-label="Daily financial KPIs" className="grid grid-cols-2 gap-3 2xl:grid-cols-5">
                <KpiCard
                  label="Today&apos;s Sales"
                  value={formatNpr(summary.totalSales)}
                  detail={`${summary.orderCount} settled bill${summary.orderCount === 1 ? '' : 's'}`}
                  icon={ReceiptText}
                  tone="via-[#FFD54F]"
                />
                <KpiCard
                  label="Physical Cash to Tally"
                  value={formatNpr(summary.physicalCashToTally)}
                  detail={`${formatNpr(summary.cashInflow)} cash inflow`}
                  icon={Banknote}
                  tone="via-[#FFB300]"
                />
                <KpiCard
                  label="Digital / QR Inflow"
                  value={formatNpr(summary.digitalInflow)}
                  detail="Counter standee settlements"
                  icon={CreditCard}
                  tone="via-[#FF6D00]"
                />
                <KpiCard
                  label="Daily Expenses"
                  value={formatNpr(summary.totalExpenses)}
                  detail={`${formatNpr(summary.cashDrawerExpenses)} from drawer`}
                  icon={CircleDollarSign}
                  tone="via-[#F4511E]"
                  action={(
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={openExpenseModal}
                      aria-label="Add expense"
                      className="h-7 w-7 shrink-0 rounded-lg text-[#FFD54F] hover:bg-[#FFB300]/10 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                />
                <KpiCard
                  label="Net Profit"
                  value={formatNpr(summary.netProfit)}
                  detail={summary.netProfit >= 0 ? 'Sales minus expenses' : 'Negative daily margin'}
                  icon={TrendingUp}
                  tone={summary.netProfit >= 0 ? 'via-[#10B981]' : 'via-[#F4511E]'}
                />
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Today&apos;s Settlement Details</p>
                      <h2 className="mt-2 text-xl font-bold text-white">Register activity</h2>
                    </div>
                    <BarChart3Icon />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-4">
                      <p className="text-xs text-[#64748B]">Average ticket size</p>
                      <p className="mt-2 font-mono text-lg font-bold text-white">{formatNpr(summary.orderCount ? summary.totalSales / summary.orderCount : 0)}</p>
                    </div>
                    <div className="rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-4">
                      <p className="text-xs text-[#64748B]">Cash / QR split</p>
                      <p className="mt-2 font-mono text-lg font-bold text-white">
                        {summary.totalSales ? `${Math.round((summary.cashInflow / summary.totalSales) * 100)}% / ${Math.round((summary.digitalInflow / summary.totalSales) * 100)}%` : '0% / 0%'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-4 text-sm text-[#6EE7B7]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Daily summary is live and updates with every sale, expense, and void.</span>
                  </div>
                </article>

                <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Shelf readiness</p>
                      <h2 className="mt-2 text-xl font-bold text-white">Stock alerts</h2>
                    </div>
                    <PackageSearch className="h-5 w-5 text-[#FFD54F]" />
                  </div>
                  {stockAlerts.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-4 text-sm text-[#6EE7B7]">
                      All tracked products are above their low-stock threshold.
                    </div>
                  ) : (
                    <div className="mt-5 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {stockAlerts.slice(0, 9).map((alert) => (
                        <div key={`${alert.itemName}-${alert.tierLabel}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#F4511E]/20 bg-[#0E0F12] px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{alert.itemName}</p>
                            <p className="mt-1 truncate text-xs text-[#94A3B8]">{alert.tierLabel} · threshold {alert.threshold}</p>
                          </div>
                          <span className={`shrink-0 font-mono text-sm font-bold ${alert.quantity <= 0 ? 'text-[#FF8A65]' : 'text-[#FFD54F]'}`}>{alert.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>

              <section className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Audit trail</p>
                    <h2 className="mt-2 text-xl font-bold text-white">Today&apos;s Bills</h2>
                  </div>
                  <Boxes className="h-5 w-5 text-[#FFD54F]" />
                </div>
                <TodayBillsTable bills={bills} onVoid={handleVoidBill} voidingSaleId={voidingSaleId} />
              </section>
            </main>
          </div>
        )}
      </DashboardShell>

      <ExpenseModal
        open={expenseOpen}
        onOpenChange={(open) => {
          if (!expenseProcessing) {
            setExpenseOpen(open);
            if (!open) setExpenseError('');
          }
        }}
        amountValue={expenseAmount}
        onAmountValueChange={setExpenseAmount}
        category={expenseCategory}
        onCategoryChange={setExpenseCategory}
        paidFrom={expensePaidFrom}
        onPaidFromChange={setExpensePaidFrom}
        note={expenseNote}
        onNoteChange={setExpenseNote}
        onSubmit={() => void handleAddExpense()}
        processing={expenseProcessing}
        errorMessage={expenseError}
      />
    </AppShell>
  );
}

function BarChart3Icon() {
  return <TrendingUp className="h-5 w-5 text-[#FFD54F]" />;
}