import React from 'react';
import { Check, Pencil, Percent, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DiscountMode = 'flat' | 'percentage';

interface DiscountControlProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discountMode: DiscountMode;
  onDiscountModeChange: (mode: DiscountMode) => void;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  appliedAmount: number;
  subtotal: number;
  onApply: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

const formatNpr = (amount: number) => `NPR ${amount.toFixed(2)}`;

export default function DiscountControl({
  open,
  onOpenChange,
  discountMode,
  onDiscountModeChange,
  inputValue,
  onInputValueChange,
  appliedAmount,
  subtotal,
  onApply,
  onRemove,
  disabled = false,
}: DiscountControlProps) {
  const hasAppliedDiscount = appliedAmount > 0;
  const modeLabel = discountMode === 'flat' ? 'NPR' : '%';

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-3">
        {hasAppliedDiscount ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10 text-[#6EE7B7]">
              <Tag className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#E2E8F0]">Discount applied</p>
              <p className="font-mono text-xs text-[#6EE7B7]">-{formatNpr(appliedAmount)}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-[#64748B]">No discount applied</span>
        )}
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          onClick={() => onOpenChange(true)}
          className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-bold text-[#FFD54F] hover:bg-[#FFB300]/10 hover:text-white"
        >
          {hasAppliedDiscount ? <Pencil className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
          {hasAppliedDiscount ? 'Edit' : '+ Discount'}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#FFB300]/25 bg-[#0E0F12] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#FFD54F]" />
            <p className="text-sm font-bold text-white">{hasAppliedDiscount ? 'Edit discount' : 'Add discount'}</p>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-[#94A3B8]">
            Discount is capped at the current subtotal of <span className="font-mono text-[#CBD5E1]">{formatNpr(subtotal)}</span>.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close discount editor"
          onClick={() => onOpenChange(false)}
          className="h-8 w-8 shrink-0 rounded-lg text-[#64748B] hover:bg-[#2A2D35] hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[#2A2D35] bg-[#14161B] p-1">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={discountMode === 'flat'}
          onClick={() => onDiscountModeChange('flat')}
          className={`min-h-10 rounded-md px-3 text-xs font-bold transition ${
            discountMode === 'flat'
              ? 'bg-[#FF6D00]/20 text-[#FFD54F] shadow-[inset_0_0_0_1px_rgba(255,109,0,0.35)]'
              : 'text-[#94A3B8] hover:bg-[#2A2D35] hover:text-white'
          }`}
        >
          Flat NPR
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={discountMode === 'percentage'}
          onClick={() => onDiscountModeChange('percentage')}
          className={`min-h-10 rounded-md px-3 text-xs font-bold transition ${
            discountMode === 'percentage'
              ? 'bg-[#FF6D00]/20 text-[#FFD54F] shadow-[inset_0_0_0_1px_rgba(255,109,0,0.35)]'
              : 'text-[#94A3B8] hover:bg-[#2A2D35] hover:text-white'
          }`}
        >
          Percentage %
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            type="number"
            min="0"
            max={discountMode === 'percentage' ? 100 : subtotal}
            step="0.01"
            inputMode="decimal"
            value={inputValue}
            onChange={(event) => onInputValueChange(event.target.value)}
            disabled={disabled}
            aria-label={`Discount amount in ${modeLabel}`}
            placeholder="0.00"
            className="h-11 border-[#2A2D35] bg-[#14161B] pr-12 font-mono text-white focus-visible:ring-[#FF6D00]"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[#64748B]">{modeLabel}</span>
        </div>
        <Button
          type="button"
          disabled={disabled || !inputValue}
          onClick={onApply}
          className="h-11 shrink-0 border-none bg-[#FF6D00] px-4 font-bold text-white hover:bg-[#F4511E]"
        >
          <Check className="h-4 w-4" />
          Apply
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Percent className="h-3 w-3 text-[#FFB300]" />
          {discountMode === 'percentage' ? 'Enter 0–100 percent.' : 'Enter a flat NPR amount.'}
        </p>
        {hasAppliedDiscount && (
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={onRemove}
            className="h-8 shrink-0 px-2 text-xs font-bold text-[#FF8A65] hover:bg-[#F4511E]/10 hover:text-[#FFB39D]"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}