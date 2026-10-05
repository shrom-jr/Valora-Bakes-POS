import React, { useMemo, useState } from 'react';
import { useCategories, useMenuItems } from '@/hooks/use-rtdb';
import { swapCategorySortOrders, deleteCategory, deleteMenuItem, updateMenuItem, MenuItem, Category } from '@/lib/rtdb';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Coins,
  ShoppingBag,
  Tags,
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
import UnifiedItemEditor from './unified-item-editor';
import UnifiedCategoryEditor from './unified-category-editor';
import ExecutiveKpiCard from '@/components/layout/executive-kpi-card';

const formatNpr = (amount: number) => `NPR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getBaseMenuPrice(item: MenuItem) {
  if (item.pricingMode === 'piece') {
    const price = item.unitPrice ?? 0;
    return Number.isFinite(price) && price >= 0 ? price : 0;
  }

  const tierPrices = Object.values(item.tiers || {})
    .map((tier) => tier.price)
    .filter((price) => Number.isFinite(price) && price >= 0);
  return tierPrices.length > 0 ? Math.min(...tierPrices) : 0;
}

const itemCardPalettes = [
  {
    border: 'border-amber-500/40 hover:border-amber-500/70',
    background: 'bg-gradient-to-b from-amber-500/10 via-[#14161B] to-[#14161B]',
    glow: 'before:via-amber-400/70',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  {
    border: 'border-cyan-500/40 hover:border-cyan-500/70',
    background: 'bg-gradient-to-b from-cyan-500/10 via-[#14161B] to-[#14161B]',
    glow: 'before:via-cyan-400/70',
    badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
  {
    border: 'border-emerald-500/40 hover:border-emerald-500/70',
    background: 'bg-gradient-to-b from-emerald-500/10 via-[#14161B] to-[#14161B]',
    glow: 'before:via-emerald-400/70',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  {
    border: 'border-rose-500/40 hover:border-rose-500/70',
    background: 'bg-gradient-to-b from-rose-500/10 via-[#14161B] to-[#14161B]',
    glow: 'before:via-rose-400/70',
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  },
  {
    border: 'border-purple-500/40 hover:border-purple-500/70',
    background: 'bg-gradient-to-b from-purple-500/10 via-[#14161B] to-[#14161B]',
    glow: 'before:via-purple-400/70',
    badge: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  },
  {
    border: 'border-orange-500/40 hover:border-orange-500/70',
    background: 'bg-gradient-to-b from-orange-500/10 via-[#14161B] to-[#14161B]',
    glow: 'before:via-orange-400/70',
    badge: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  },
] as const;

export default function UnifiedMenuWorkspace() {
  const { categories, loading: catLoading, error: catError } = useCategories();
  const { items, loading: itemsLoading, error: itemsError } = useMenuItems();
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

  const totalMenuPrice = useMemo(
    () => items.reduce((total, item) => total + getBaseMenuPrice(item), 0),
    [items],
  );

  const selectedCategoryData = categories.find((category) => category.id === selectedCategory);
  const selectedCategoryIndex = categories.findIndex((category) => category.id === selectedCategory);

  const handleOpenAddItem = () => {
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

  const handleToggleActive = async (item: MenuItem, active: boolean) => {
    try {
      await updateMenuItem(item.id, { active });
      toast({ title: `${item.name} ${active ? 'is active on POS' : 'is hidden from POS'}` });
    } catch (err: any) {
      toast({ title: 'Error updating item', description: err.message, variant: 'destructive' });
    }
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

  if (catError || itemsError) {
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

  if (catLoading || itemsLoading) {
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
    <div className="min-h-full bg-[#0E0F12]">
      <main className="mx-auto min-h-full w-full max-w-6xl space-y-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Menu Management</h1>
        </header>

        <section aria-label="Catalog summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ExecutiveKpiCard label="Total Items" value={String(items.length)} icon={ShoppingBag} theme="amber" />
          <ExecutiveKpiCard label="Total Categories" value={String(categories.length)} icon={Tags} theme="cyan" />
          <ExecutiveKpiCard label="Total Menu Price" value={formatNpr(totalMenuPrice)} icon={Coins} theme="emerald" />
          <ExecutiveKpiCard
            label="Average Item Price"
            value={formatNpr(items.length > 0 ? totalMenuPrice / items.length : 0)}
            icon={Calculator}
            theme="purple"
          />
        </section>

        <section aria-label="Catalog actions" className="flex flex-col gap-4 rounded-2xl border border-[#FF6D00]/15 bg-[#14161B]/80 p-3 shadow-[0_12px_35px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
            <Button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold ${selectedCategory === 'all' ? 'bg-[#FF6D00] text-white shadow-[0_0_16px_rgba(255,109,0,0.2)] hover:bg-[#F4511E]' : 'border border-[#2A2D35] bg-[#0E0F12] text-slate-200 hover:border-[#FF6D00]/40 hover:text-white'}`}
            >
              All Items
            </Button>
            {categories.map((category) => {
              const selected = selectedCategory === category.id;
              const deleteBlocked = items.some((item) => item.categoryId === category.id);
              return (
                <div
                  key={category.id}
                  className={`group inline-flex h-10 shrink-0 items-center overflow-hidden rounded-full border transition ${
                    selected
                      ? 'border-[#FF6D00]/60 bg-[#FF6D00]/15 text-[#FFD54F]'
                      : category.active
                        ? 'border-[#2A2D35] bg-[#0E0F12] text-slate-200 hover:border-[#FF6D00]/40'
                        : 'border-[#2A2D35] bg-[#0E0F12] text-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`h-full whitespace-nowrap px-4 text-sm font-semibold ${!category.active ? 'line-through' : ''}`}
                  >
                    {category.name}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Manage ${category.name}`}
                        title={`Manage ${category.name}`}
                        className="flex h-full w-8 items-center justify-center text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:outline-none"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 border-[#FF6D00]/20 bg-[#14161B] text-white">
                      <DropdownMenuLabel className="text-slate-200">{category.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#2A2D35]" />
                      <DropdownMenuItem onSelect={() => handleOpenEditCategory(category)} className="focus:bg-[#FF6D00]/10 focus:text-white">
                        <Pencil className="mr-2 h-4 w-4" /> Rename category
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => void handleDeleteCategory(category)}
                        disabled={deleteBlocked}
                        title={deleteBlocked ? 'Remove or reassign its items before deleting' : undefined}
                        className="text-[#FF8A65] focus:bg-[#F4511E]/10 focus:text-[#FF8A65]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> {deleteBlocked ? 'Delete category (items assigned)' : 'Delete category'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            {selectedCategoryData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={`Manage ${selectedCategoryData.name}`}
                    aria-label={`Manage ${selectedCategoryData.name}`}
                    className="min-h-10 min-w-10 rounded-full text-slate-200 hover:bg-[#FF6D00]/10 hover:text-[#FFD54F]"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 border-[#FF6D00]/20 bg-[#14161B] text-white">
                  <DropdownMenuLabel className="text-slate-200">{selectedCategoryData.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2A2D35]" />
                  <DropdownMenuItem onSelect={() => void handleMoveCategory(-1)} disabled={selectedCategoryIndex <= 0} className="focus:bg-[#FF6D00]/10 focus:text-white">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Move left
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void handleMoveCategory(1)} disabled={selectedCategoryIndex < 0 || selectedCategoryIndex >= categories.length - 1} className="focus:bg-[#FF6D00]/10 focus:text-white">
                    <ChevronRight className="mr-2 h-4 w-4" /> Move right
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
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-200">{emptyStateDescription}</p>
            <Button
              type="button"
              onClick={handleOpenAddItem}
              className="mt-6 border-none bg-gradient-to-r from-[#FFB300] to-[#F4511E] font-bold text-white shadow-[0_0_18px_rgba(255,109,0,0.2)] hover:brightness-110"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </section>
        ) : (
        <section aria-label="Catalog items" className="grid grid-cols-2 gap-3 pb-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {filteredItems.map((item, index) => {
              const category = categories.find((candidate) => candidate.id === item.categoryId);
              const palette = itemCardPalettes[index % itemCardPalettes.length];
              const tiers = Object.values(item.tiers || {});
              const isPiece = item.pricingMode === 'piece';
              const baseTier = [...tiers].sort((a, b) => a.price - b.price)[0];
              const displayPrice = formatNpr(getBaseMenuPrice(item));
              const sizeLabel = isPiece
                ? 'Per piece'
                : baseTier && baseTier.weightLb !== null && baseTier.weightLb !== undefined
                  ? `${baseTier.weightLb.toLocaleString('en-US', { maximumFractionDigits: 2 })} lb (Pound)`
                  : baseTier?.label || 'Weight option';

              return (
                <article
                  key={item.id}
                  className={`group relative flex h-full min-h-[130px] flex-col overflow-hidden rounded-xl border p-3.5 shadow-[0_14px_35px_rgba(0,0,0,0.26)] transition duration-300 before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent ${palette.glow} ${palette.background} ${
                    item.active
                      ? `${palette.border} hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,0,0,0.35),0_0_24px_rgba(255,109,0,0.08)]`
                      : `${palette.border} opacity-75`
                  }`}
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 title={item.name} className={`truncate text-base font-bold ${item.active ? 'text-white' : 'text-slate-200 line-through'}`}>{item.name}</h2>
                        {!item.active && <span className="shrink-0 rounded-full bg-[#2A2D35] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-200">Inactive</span>}
                      </div>
                      <span className={`mt-2 inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${palette.badge}`} title={category?.name || 'Uncategorized'}>
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
                          className="h-8 w-8 shrink-0 rounded-full text-slate-200 hover:bg-[#FF6D00]/10 hover:text-white"
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

                  <div className="mt-3">
                    <p className="whitespace-nowrap font-mono text-base font-bold tracking-tight text-white sm:text-lg 2xl:text-base">{displayPrice}</p>
                    <p className="mt-1 text-xs font-medium text-slate-200">{sizeLabel}</p>
                  </div>

                  <div className="mt-auto border-t border-[#2A2D35] pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.active ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-[#64748B]'}`} />
                        <p className="whitespace-nowrap text-[11px] font-semibold text-slate-200">Active on POS</p>
                      </div>
                      <Switch
                        checked={item.active}
                        onCheckedChange={(active) => void handleToggleActive(item, active)}
                        aria-label={`${item.active ? 'Disable' : 'Enable'} ${item.name} on POS`}
                      />
                    </div>
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