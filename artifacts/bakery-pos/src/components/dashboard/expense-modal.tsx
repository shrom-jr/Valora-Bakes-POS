import React, { useEffect, useRef } from 'react';
import {
  Banknote,
  Boxes,
  ChefHat,
  CircleAlert,
  Milk,
  MoreHorizontal,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type ExpenseCategory = 'dairy' | 'packaging' | 'kitchen' | 'utilities' | 'other';
export type ExpensePaidFrom = 'cashDrawer' | 'bankPersonal';

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountValue: string;
  onAmountValueChange: (value: string) => void;
  category: ExpenseCategory;
  onCategoryChange: (category: ExpenseCategory) => void;
  paidFrom: ExpensePaidFrom;
  onPaidFromChange: (value: ExpensePaidFrom) => void;
  note: string;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
  processing: boolean;
  errorMessage?: string;
}

const categories: Array<{ value: ExpenseCategory; label: string; icon: React.ElementType }> = [
  { value: 'dairy', label: 'Dairy / Milk', icon: Milk },
  { value: 'packaging', label: 'Packaging / Boxes', icon: Boxes },
  { value: 'kitchen', label: 'Kitchen / Ingredients', icon: ChefHat },
  { value: 'utilities', label: 'Utilities', icon: Zap },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function ExpenseModal({
  open,
  onOpenChange,
  amountValue,
  onAmountValueChange,
  category,
  onCategoryChange,
  paidFrom,
  onPaidFromChange,
  note,
  onNoteChange,
  onSubmit,
  processing,
  errorMessage,
}: ExpenseModalProps) {
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => amountRef.current?.focus(), 80);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg border-[#FF6D00]/25 bg-[#14161B] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Banknote className="h-5 w-5 text-[#FFD54F]" />
            Add daily expense
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            Record an outflow so the daily cash tally and net profit stay accurate.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-2">
            <label htmlFor="expense-amount" className="text-sm font-bold text-[#E2E8F0]">
              Amount (NPR)
            </label>
            <Input
              ref={amountRef}
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={amountValue}
              onChange={(event) => onAmountValueChange(event.target.value)}
              disabled={processing}
              placeholder="0.00"
              autoComplete="off"
              className="h-12 border-[#2A2D35] bg-[#0E0F12] font-mono text-lg text-white focus-visible:ring-[#FF6D00]"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-[#E2E8F0]">Quick category</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map(({ value, label, icon: Icon }) => {
                const selected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={processing}
                    aria-pressed={selected}
                    onClick={() => onCategoryChange(value)}
                    className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                      selected
                        ? 'border-[#FFB300]/60 bg-[#FFB300]/15 text-[#FFD54F] shadow-[inset_0_0_0_1px_rgba(255,179,0,0.2)]'
                        : 'border-[#2A2D35] bg-[#0E0F12] text-[#94A3B8] hover:border-[#FF6D00]/45 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-[#E2E8F0]">Paid from</legend>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-1">
              {[
                { value: 'cashDrawer' as const, label: 'Cash Drawer' },
                { value: 'bankPersonal' as const, label: 'Bank / Personal Account' },
              ].map((option) => {
                const selected = paidFrom === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={processing}
                    aria-pressed={selected}
                    onClick={() => onPaidFromChange(option.value)}
                    className={`min-h-11 rounded-lg px-2 text-xs font-bold transition ${
                      selected
                        ? 'bg-[#FF6D00]/20 text-[#FFD54F] shadow-[inset_0_0_0_1px_rgba(255,109,0,0.35)]'
                        : 'text-[#94A3B8] hover:bg-[#2A2D35] hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="expense-note" className="text-sm font-bold text-[#E2E8F0]">
              Note <span className="font-normal text-[#64748B]">(Optional)</span>
            </label>
            <Input
              id="expense-note"
              type="text"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              disabled={processing}
              placeholder="5L fresh milk delivery"
              maxLength={160}
              className="h-11 border-[#2A2D35] bg-[#0E0F12] text-white focus-visible:ring-[#FF6D00]"
            />
          </div>

          {errorMessage && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-[#F4511E]/25 bg-[#F4511E]/10 px-3 py-2 text-xs font-semibold leading-5 text-[#FFB39D]">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}

          <Button
            type="submit"
            disabled={processing || !amountValue}
            className="h-12 w-full border-none bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] font-bold text-white shadow-[0_0_22px_rgba(255,109,0,0.22)] hover:brightness-110"
          >
            {processing ? 'Saving expense…' : 'Save Expense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}