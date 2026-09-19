import React, { useMemo, useState } from 'react';
import { AlertCircle, Boxes, CheckCircle2, CircleX, Loader2, PackageSearch, Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCategories, useMenuItems, useShelfInventory } from '@/hooks/use-rtdb';
import { addInventory, MenuItem, ShelfInventory } from '@/lib/rtdb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ExecutiveKpiCard from '@/components/layout/executive-kpi-card';

function InventoryActions({ item, label, inventoryKey, inventory }: { item: MenuItem; label: string; inventoryKey: string; inventory: Record<string, ShelfInventory> }) {
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const currentQuantity = inventory[inventoryKey]?.availableQuantity ?? 0;
  const addQuantity = async (amount: number) => {
    if (!Number.isInteger(amount) || amount <= 0) {
      toast({ title: 'Validation', description: 'Bake quantity must be a positive integer', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    try {
      await addInventory(inventoryKey, amount);
      toast({ title: `Added ${amount} to ${item.name} (${label})` });
      setCustomAmount('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {[1, 5, 10].map((amount) => (
        <Button
          key={amount}
          type="button"
          variant="outline"
          disabled={processing}
          onClick={() => void addQuantity(amount)}
          className="h-10 min-w-11 border-[#2A2D35] bg-[#0E0F12] px-2 font-mono text-xs text-[#E2E8F0] hover:border-[#FF6D00]/60 hover:bg-[#FF6D00]/10 hover:text-[#FFD54F]"
          aria-label={`Add ${amount} ${label} to ${item.name}`}
        >
          +{amount}
        </Button>
      ))}
      <div className="flex">
        <Input
          type="number"
          min="1"
          step="1"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          disabled={processing}
          placeholder="#"
          aria-label={`Custom bake quantity for ${item.name} ${label}`}
          className="h-10 w-16 rounded-r-none border-[#2A2D35] bg-[#0E0F12] px-2 text-center font-mono text-xs text-white focus-visible:ring-[#FF6D00]"
        />
        <Button
          type="button"
          disabled={processing}
          onClick={() => void addQuantity(Number(customAmount || '0'))}
          className="h-10 rounded-l-none border-none bg-[#FF6D00] px-2 text-white hover:bg-[#F4511E]"
          aria-label={`Confirm custom bake quantity for ${item.name} ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <span className="ml-2 hidden font-mono text-xs text-[#64748B] xl:inline">now {currentQuantity}</span>
    </div>
  );
}

function StockPill({ item, stock }: { item: MenuItem; stock?: ShelfInventory }) {
  if (!item.trackStock) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2D35] bg-[#0E0F12] px-3 py-1.5 text-xs font-semibold text-[#94A3B8]"><span className="text-[10px] text-[#64748B]">●</span> Always Available</span>;
  }
  const quantity = stock?.availableQuantity ?? 0;
  const threshold = stock?.lowStockLevel ?? 5;
  const soldOut = quantity <= 0;
  const low = !soldOut && quantity <= threshold;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
      soldOut ? 'border-[#F4511E]/25 bg-[#F4511E]/10 text-[#FF8A65]' : low ? 'border-[#FFB300]/25 bg-[#FFB300]/10 text-[#FFD54F]' : 'border-[#10B981]/25 bg-[#10B981]/10 text-[#6EE7B7]'
    }`}>
      <span className="text-[10px]">●</span>
      {soldOut ? 'Sold Out' : low ? 'Low Stock' : 'In Stock'}
    </span>
  );
}

function InventoryLine({ item, label, categoryName, inventoryKey, inventory }: { item: MenuItem; label: string; categoryName: string; inventoryKey: string; inventory: Record<string, ShelfInventory> }) {
  const stock = inventory[inventoryKey];
  const quantity = stock?.availableQuantity ?? 0;
  return (
    <div className="grid gap-3 border-t border-[#2A2D35] px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)_auto_auto_minmax(0,1.6fr)] md:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-white">{item.name}</p>
          {!item.active && <span className="rounded-full bg-[#2A2D35] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Inactive</span>}
        </div>
        <p className="mt-1 text-xs text-[#94A3B8]">{label} · {item.pricingMode === 'piece' ? 'Per Piece' : 'By Weight / Pound'}</p>
      </div>
      <span className="truncate text-xs font-semibold text-[#CBD5E1]">{categoryName}</span>
      <span className="font-mono text-sm font-bold text-white">{item.trackStock ? quantity : '—'}</span>
      <StockPill item={item} stock={stock} />
      {item.trackStock ? (
        <InventoryActions item={item} label={label} inventoryKey={inventoryKey} inventory={inventory} />
      ) : (
        <span className="text-xs text-[#64748B]">Inventory tracking disabled</span>
      )}
    </div>
  );
}

export default function InventoryWorkspace() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { inventory, loading: inventoryLoading, error: inventoryError } = useShelfInventory();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const inventoryRows = useMemo(() => items.flatMap((item) => {
    const categoryName = categories.find((category) => category.id === item.categoryId)?.name || 'Uncategorized';
    if (item.pricingMode === 'piece') {
      return [{ item, label: 'Per piece', categoryName, inventoryKey: item.id, stock: inventory[item.id] }];
    }
    return Object.entries(item.tiers || {}).map(([tierId, tier]) => ({
      item,
      label: tier.label,
      categoryName,
      inventoryKey: `${item.id}__${tierId}`,
      stock: inventory[`${item.id}__${tierId}`],
    }));
  }), [categories, inventory, items]);

  const filteredRows = useMemo(
    () => selectedCategory === 'all' ? inventoryRows : inventoryRows.filter((row) => row.item.categoryId === selectedCategory),
    [inventoryRows, selectedCategory],
  );

  const trackedRows = inventoryRows.filter((row) => row.item.trackStock);
  const totalShelfUnits = trackedRows.reduce((total, row) => total + (row.stock?.availableQuantity ?? 0), 0);
  const fullyStockedCount = trackedRows.filter((row) => {
    const quantity = row.stock?.availableQuantity ?? 0;
    return quantity > (row.stock?.lowStockLevel ?? 5);
  }).length;
  const lowStockCount = trackedRows.filter((row) => {
    const quantity = row.stock?.availableQuantity ?? 0;
    const threshold = row.stock?.lowStockLevel ?? 5;
    return quantity > 0 && quantity <= threshold;
  }).length;
  const soldOutCount = trackedRows.filter((row) => (row.stock?.availableQuantity ?? 0) <= 0).length;

  const isLoading = categoriesLoading || itemsLoading || inventoryLoading;

  if (categoriesError || itemsError || inventoryError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#0E0F12] p-8 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-[#F4511E]" />
        <p className="font-bold text-white">Unable to load shelf inventory</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-5 border-[#F4511E]/25 bg-[#14161B] text-white hover:bg-[#2A2D35]">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center bg-[#0E0F12]"><Loader2 className="h-8 w-8 animate-spin text-[#FF6D00]" /></div>;
  }

  return (
    <div className="min-h-full bg-[#0E0F12]">
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB300]">Morning bake control</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Shelf Inventory</h1>
            <p className="mt-2 text-sm text-[#94A3B8]">Update shelf counts quickly as fresh bakes leave the oven.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
            <PackageSearch className="h-4 w-4 text-[#FFD54F]" />
            {filteredRows.length} stock {filteredRows.length === 1 ? 'line' : 'lines'}
          </div>
        </header>

        <section aria-label="Shelf health summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ExecutiveKpiCard label="Total Shelf Units" value={String(totalShelfUnits)} detail="Baked units available" icon={Boxes} tone="via-[#FFD54F]" />
          <ExecutiveKpiCard label="Fully Stocked" value={String(fullyStockedCount)} detail="Above warning level" icon={CheckCircle2} tone="via-[#10B981]" />
          <ExecutiveKpiCard label="Low Stock Warnings" value={String(lowStockCount)} detail="Needs a fresh bake" icon={TriangleAlert} tone="via-[#FFB300]" />
          <ExecutiveKpiCard label="Sold Out Bakes" value={String(soldOutCount)} detail="Currently at zero" icon={CircleX} tone="via-[#F4511E]" />
        </section>

        <section aria-label="Inventory filters" className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-[#FF6D00]/15 bg-[#14161B]/80 p-3 no-scrollbar">
          <Button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ${selectedCategory === 'all' ? 'bg-[#FF6D00] text-white hover:bg-[#F4511E]' : 'border border-[#2A2D35] bg-[#0E0F12] text-[#94A3B8] hover:text-white'}`}
          >
            All Items
          </Button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`min-h-10 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${selectedCategory === category.id ? 'border-[#FF6D00]/60 bg-[#FF6D00]/15 text-[#FFD54F]' : 'border-[#2A2D35] bg-[#0E0F12] text-[#94A3B8] hover:border-[#FF6D00]/40 hover:text-white'}`}
            >
              {category.name}
            </button>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] shadow-[0_14px_35px_rgba(0,0,0,0.2)]">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)_auto_auto_minmax(0,1.6fr)] gap-3 border-b border-[#FF6D00]/15 bg-[#0E0F12]/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B] md:grid">
            <span>Product / variant</span>
            <span>Category</span>
            <span>Current shelf stock</span>
            <span>Live status</span>
            <span>Quick add fresh bake</span>
          </div>
          {filteredRows.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
              <PackageSearch className="h-9 w-9 text-[#64748B]" />
              <h2 className="mt-4 text-lg font-bold text-white">No products in this category</h2>
              <p className="mt-2 text-sm text-[#94A3B8]">Inventory rows will appear when products are added.</p>
            </div>
          ) : (
            filteredRows.map((row) => (
              <InventoryLine
                key={row.inventoryKey}
                item={row.item}
                label={row.label}
                categoryName={row.categoryName}
                inventoryKey={row.inventoryKey}
                inventory={inventory}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}