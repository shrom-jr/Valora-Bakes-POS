import React, { useMemo, useState } from 'react';
import { useCategories, useMenuItems, useShelfInventory } from '@/hooks/use-rtdb';
import { swapCategorySortOrders, deleteCategory, deleteMenuItem, addInventory, MenuItem, Category, ShelfInventory } from '@/lib/rtdb';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  Store,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import UnifiedItemEditor from './unified-item-editor';
import UnifiedCategoryEditor from './unified-category-editor';

interface RestockPopoverProps {
  label: string;
  item: MenuItem;
  inventoryKey: string;
  inventory: Record<string, ShelfInventory>;
}

function RestockPopover({ label, item, inventoryKey, inventory }: RestockPopoverProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const inventoryEntry = inventory[inventoryKey];
  const currentQty = inventoryEntry?.availableQuantity ?? 0;
  const lowStockLevel = inventoryEntry?.lowStockLevel ?? 5;
  const isSoldOut = currentQty <= 0;
  const isLow = currentQty > 0 && currentQty <= lowStockLevel;

  const handleConfirm = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Validation',
        description: 'Restock amount must be a positive integer',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      await addInventory(inventoryKey, parsedAmount);
      toast({ title: `Added ${parsedAmount} to ${item.name} (${label})` });
      setAmount('');
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const statusClass = isSoldOut
    ? 'border-[#F4511E]/25 bg-[#F4511E]/10 text-[#FF8A65]'
    : isLow
      ? 'border-[#FFB300]/25 bg-[#FFB300]/10 text-[#FFD54F]'
      : 'border-[#10B981]/25 bg-[#10B981]/10 text-[#6EE7B7]';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Quick Restock"
          aria-label={`Quick restock ${item.name}, ${label}`}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB300] ${statusClass}`}
        >
          <span aria-hidden="true" className="text-[10px]">●</span>
          <span>{isSoldOut ? 'Sold Out' : `${currentQty} in Stock`}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[280px] border-[#FF6D00]/25 bg-[#14161B] p-4 text-white shadow-[0_18px_55px_rgba(0,0,0,0.55),0_0_22px_rgba(255,109,0,0.12)]"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-white">Quick Restock</p>
            <p className="mt-1 truncate text-xs text-[#94A3B8]">{item.name} · {label}</p>
          </div>

          <div className="flex items-end justify-between rounded-xl border border-[#FF6D00]/15 bg-[#0E0F12] px-3 py-2.5">
            <span className="text-xs text-[#94A3B8]">Current stock</span>
            <span className="font-mono text-lg font-bold text-white">{currentQty}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 5, 10].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(String(quickAmount))}
                className={`min-h-10 rounded-lg border text-sm font-bold transition ${
                  amount === String(quickAmount)
                    ? 'border-[#FF6D00] bg-[#FF6D00]/20 text-[#FFD54F]'
                    : 'border-[#2A2D35] bg-[#0E0F12] text-[#CBD5E1] hover:border-[#FF6D00]/50 hover:text-white'
                }`}
              >
                +{quickAmount}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
            Custom amount
            <Input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleConfirm();
              }}
              disabled={processing}
              placeholder="Enter quantity"
              className="mt-2 h-10 border-[#2A2D35] bg-[#0E0F12] font-mono text-white focus-visible:ring-[#FF6D00]"
            />
          </label>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="h-10 w-full border-none bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] font-bold text-white shadow-[0_0_18px_rgba(255,109,0,0.2)] hover:brightness-110"
          >
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Confirm Restock
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UnlimitedBadge() {
  return (
    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#2A2D35] bg-[#0E0F12] px-3 py-1.5 text-xs font-semibold text-[#94A3B8]">
      <span aria-hidden="true" className="text-[10px] text-[#64748B]">●</span>
      Always Available
    </span>
  );
}

function StockBadge({
  item,
  label,
  inventoryKey,
  inventory,
}: {
  item: MenuItem;
  label: string;
  inventoryKey: string;
  inventory: Record<string, ShelfInventory>;
}) {
  if (!item.trackStock) return <UnlimitedBadge />;
  return <RestockPopover label={label} item={item} inventoryKey={inventoryKey} inventory={inventory} />;
}

export default function UnifiedMenuWorkspace() {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
  const { inventory, loading: invLoading, error: invError } = useShelfInventory();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.categoryId === selectedCategory);
  }, [items, selectedCategory]);

  const maxCatSortOrder = useMemo(
    () => (categories.length > 0 ? Math.max(...categories.map((category) => category.sortOrder)) : 0),
    [categories],
  );

  const selectedCategoryData = categories.find((category) => category.id === selectedCategory);
  const selectedCategoryIndex = categories.findIndex((category) => category.id === selectedCategory);

  const handleOpenAddItem = () => {
    if (categories.length === 0) {
      toast({ title: 'Requires Category', description: 'Create a category first.', variant: 'destructive' });
      return;
    }
    setEditingItem(null);
    setIsItemEditorOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsItemEditorOpen(true);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await deleteMenuItem(item.id, item.pricingMode, item.tiers ? Object.keys(item.tiers) : []);
      toast({ title: 'Item deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryEditorOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryEditorOpen(true);
  };

  const handleMoveCategory = async (direction: number) => {
    if (selectedCategoryIndex < 0) return;
    const targetIndex = selectedCategoryIndex + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[selectedCategoryIndex];
    const target = categories[targetIndex];
    try {
      await swapCategorySortOrders(current.id, current.sortOrder, target.id, target.sortOrder);
    } catch (err: any) {
      toast({ title: 'Error moving category', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (items.some((item) => item.categoryId === category.id)) {
      toast({ title: 'Cannot delete', description: 'Category is used by existing menu items.', variant: 'destructive' });
      return;
    }
    if (!window.confirm(`Delete category ${category.name}?`)) return;
    try {
      await deleteCategory(category.id);
      toast({ title: 'Category deleted' });
      if (selectedCategory === category.id) setSelectedCategory('all');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (catError || itemsError || invError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#0E0F12] p-12 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-[#F4511E]" />
        <p className="mb-2 font-bold text-white">Error loading workspace</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-[#F4511E]/25 bg-[#14161B] text-white hover:bg-[#2A2D35]">
          Retry
        </Button>
      </div>
    );
  }

  if (catLoading || itemsLoading || invLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0E0F12]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6D00]" />
      </div>
    );
  }

  const emptyStateTitle = selectedCategory === 'all' ? 'No catalog items yet' : 'No items in this category';
  const emptyStateDescription = selectedCategory === 'all'
    ? 'Start building the catalog with your first bakery item.'
    : `Add an item to ${selectedCategoryData?.name || 'this category'} to see it here.`;

  return (
    <div className="h-full overflow-y-auto bg-[#0E0F12]">
      <main className="mx-auto min-h-full w-full max-w-6xl px-4 py-5 md:px-8 md:py-8">
        <header className="mb-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB300]">Catalog control</p>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Menu &amp; Prices</h1>
              <p className="mt-2 max-w-xl text-sm text-[#94A3B8]">A live retail catalog for prices, stock, and bakery-ready availability.</p>
            </div>
            <div className="font-mono text-xs text-[#64748B]">{items.length} {items.length === 1 ? 'item' : 'items'} · {categories.length} {categories.length === 1 ? 'category' : 'categories'}</div>
          </div>
        </header>

        <section aria-label="Catalog actions" className="mb-7 flex flex-col gap-4 rounded-2xl border border-[#FF6D00]/15 bg-[#14161B]/80 p-3 shadow-[0_12px_35px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
            <Button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold ${selectedCategory === 'all' ? 'bg-[#FF6D00] text-white shadow-[0_0_16px_rgba(255,109,0,0.2)] hover:bg-[#F4511E]' : 'border border-[#2A2D35] bg-[#0E0F12] text-[#94A3B8] hover:border-[#FF6D00]/40 hover:text-white'}`}
            >
              All Items
            </Button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`min-h-10 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${
                  selectedCategory === category.id
                    ? 'border-[#FF6D00]/60 bg-[#FF6D00]/15 text-[#FFD54F]'
                    : category.active
                      ? 'border-[#2A2D35] bg-[#0E0F12] text-[#94A3B8] hover:border-[#FF6D00]/40 hover:text-white'
                      : 'border-[#2A2D35] bg-[#0E0F12] text-[#64748B] line-through hover:text-[#94A3B8]'
                }`}
              >
                {category.name}
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleOpenAddCategory}
              title="Add category"
              aria-label="Add category"
              className="min-h-10 min-w-10 rounded-full border-[#FFB300]/30 bg-[#0E0F12] text-[#FFD54F] hover:border-[#FFB300] hover:bg-[#FFB300]/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {selectedCategoryData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={`Manage ${selectedCategoryData.name}`}
                    aria-label={`Manage ${selectedCategoryData.name}`}
                    className="min-h-10 min-w-10 rounded-full text-[#64748B] hover:bg-[#FF6D00]/10 hover:text-[#FFD54F]"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 border-[#FF6D00]/20 bg-[#14161B] text-white">
                  <DropdownMenuLabel className="text-[#94A3B8]">{selectedCategoryData.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2A2D35]" />
                  <DropdownMenuItem onSelect={() => void handleMoveCategory(-1)} disabled={selectedCategoryIndex <= 0} className="focus:bg-[#FF6D00]/10 focus:text-white">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Move left
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void handleMoveCategory(1)} disabled={selectedCategoryIndex < 0 || selectedCategoryIndex >= categories.length - 1} className="focus:bg-[#FF6D00]/10 focus:text-white">
                    <ChevronRight className="mr-2 h-4 w-4" /> Move right
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleOpenEditCategory(selectedCategoryData)} className="focus:bg-[#FF6D00]/10 focus:text-white">
                    <Pencil className="mr-2 h-4 w-4" /> Edit category
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void handleDeleteCategory(selectedCategoryData)} className="text-[#FF8A65] focus:bg-[#F4511E]/10 focus:text-[#FF8A65]">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Button
            type="button"
            onClick={handleOpenAddItem}
            className="min-h-11 shrink-0 border-none bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] px-5 font-bold text-white shadow-[0_0_22px_rgba(255,109,0,0.25)] hover:brightness-110"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Menu Item
          </Button>
        </section>

        {filteredItems.length === 0 ? (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[26px] border border-[#FF6D00]/15 bg-[#14161B]/65 px-6 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#FFB300]/30 bg-gradient-to-br from-[#FFB300]/20 via-[#FF6D00]/10 to-[#F4511E]/20 shadow-[0_0_35px_rgba(255,109,0,0.2)]">
              <Store className="h-9 w-9 text-[#FFD54F]" />
            </div>
            <h2 className="text-xl font-bold text-white">{emptyStateTitle}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#94A3B8]">{emptyStateDescription}</p>
            <Button
              type="button"
              onClick={handleOpenAddItem}
              className="mt-6 border-none bg-gradient-to-r from-[#FFB300] to-[#F4511E] font-bold text-white shadow-[0_0_18px_rgba(255,109,0,0.2)] hover:brightness-110"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </section>
        ) : (
          <section aria-label="Catalog items" className="grid grid-cols-1 gap-5 pb-12 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const category = categories.find((candidate) => candidate.id === item.categoryId);
              const tiers = Object.values(item.tiers || {});
              const isPiece = item.pricingMode === 'piece';
              const lowestPrice = tiers.length > 0 ? Math.min(...tiers.map((tier) => tier.price)) : 0;
              const displayPrice = isPiece
                ? `NPR ${(item.unitPrice || 0).toFixed(2)}`
                : `From NPR ${lowestPrice.toFixed(2)}`;

              return (
                <article
                  key={item.id}
                  className={`group relative overflow-hidden rounded-[22px] border bg-[#14161B] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.26)] transition duration-300 before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#FFD54F] before:to-transparent ${
                    item.active
                      ? 'border-[#FF6D00]/15 hover:-translate-y-0.5 hover:border-[#FF6D00]/40 hover:shadow-[0_18px_42px_rgba(0,0,0,0.35),0_0_24px_rgba(255,109,0,0.08)]'
                      : 'border-[#2A2D35] opacity-75'
                  }`}
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className={`truncate text-base font-bold ${item.active ? 'text-white' : 'text-[#94A3B8] line-through'}`}>{item.name}</h2>
                        {!item.active && <span className="shrink-0 rounded-full bg-[#2A2D35] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Inactive</span>}
                      </div>
                      <span className="mt-2 inline-flex rounded-full border border-[#FFB300]/20 bg-[#FFB300]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FFD54F]">
                        {category?.name || 'Uncategorized'}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`More actions for ${item.name}`}
                          className="min-h-10 min-w-10 shrink-0 rounded-full text-[#64748B] hover:bg-[#FF6D00]/10 hover:text-white"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 border-[#FF6D00]/20 bg-[#14161B] text-white">
                        <DropdownMenuItem onSelect={() => handleOpenEditItem(item)} className="focus:bg-[#FF6D00]/10 focus:text-white">
                          <Pencil className="mr-2 h-4 w-4" /> Edit item
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void handleDeleteItem(item)} className="text-[#FF8A65] focus:bg-[#F4511E]/10 focus:text-[#FF8A65]">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </header>

                  <div className="mt-6">
                    <p className="font-mono text-2xl font-bold tracking-tight text-white">{displayPrice}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{isPiece ? 'Per piece' : `${tiers.length} weight ${tiers.length === 1 ? 'tier' : 'tiers'}`}</p>
                  </div>

                  <div className="mt-6 space-y-2">
                    {isPiece ? (
                      <div className="flex items-center justify-between gap-3 border-t border-[#2A2D35] pt-3">
                        <span className="text-sm text-[#CBD5E1]">Piece</span>
                        <StockBadge item={item} label="Piece" inventoryKey={item.id} inventory={inventory} />
                      </div>
                    ) : (
                      Object.entries(item.tiers || {}).map(([tierId, tier]) => (
                        <div key={tierId} className="flex items-center justify-between gap-3 border-t border-[#2A2D35] pt-3 first:border-t-0 first:pt-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#E2E8F0]">{tier.label}</p>
                            <p className="mt-1 font-mono text-xs text-[#94A3B8]">NPR {tier.price.toFixed(2)}</p>
                          </div>
                          <StockBadge item={item} label={tier.label} inventoryKey={`${item.id}__${tierId}`} inventory={inventory} />
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <UnifiedItemEditor
        isOpen={isItemEditorOpen}
        onClose={() => setIsItemEditorOpen(false)}
        existingItem={editingItem}
        categories={categories}
        inventory={inventory}
        defaultCategoryId={selectedCategory === 'all' ? categories.find((category) => category.active)?.id : selectedCategory}
      />

      <UnifiedCategoryEditor
        isOpen={isCategoryEditorOpen}
        onClose={() => setIsCategoryEditorOpen(false)}
        existingCategory={editingCategory}
        maxSortOrder={maxCatSortOrder}
      />
    </div>
  );
}